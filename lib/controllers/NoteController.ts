import db, { core, debufferize } from "../db";
import path from "path";
import crypto from "crypto"
import { readdir, rmdirSync } from 'fs-extra';
import { User } from "./UserController";
import redis from '../redis'
import utils from '../utils'
 
const self = {
    
    search: async(query_string: string, page: number, subject_id?: number, author_id?: string): Promise<{ result: any, pages: number } | null> => {

        try{
            
            let redis_query = `${query_string}-${subject_id || "anysubject"}-${author_id || "anyauthor"}-${page.toString()}`

            let cached = await redis.get('notes', redis_query);
            let params = new Array();
            if(cached){
                console.log(`returning ${redis_query}`);
                
                return JSON.parse(cached as string);
            }
            params.push(`%${query_string}%`)
            if(subject_id)
                params.push(subject_id);
            if(author_id)
                params.push(author_id);
            
            let s = (page - 1) * 10;

            params.push(s);
            
            
            let pages = Math.trunc((await db.query(`
                select count(*) as count from notes where title like ?
                ${(subject_id) ? "and notes.subject_id = ?" : ""}
                ${(author_id) ? "and notes.author_id = ?" : ""}
            `, params)).results[0].count  / 10) + 1 // ci sarà sicuramente un modo migliore di farlo, ma è l'una e non ho voglia         
               

            let query = await db.query(`                    
                    select 
                    notes.id, 
                    notes.title, 
                    notes.uploaded_at, 
                    notes.subject_id, 
                    notes.visits, 
                    notes.author_id,
                    aes_decrypt(users.name, ${ core.escape(process.env.AES_KEY!) }) as name, 
                    aes_decrypt(users.surname, ${ core.escape(process.env.AES_KEY!) }) as surname 
                    from notes left join users on notes.author_id = users.id
                    where title like ? 
                    ${(subject_id) ? "and notes.subject_id = ?" : ""}
                    ${(author_id) ? "and notes.author_id = ?" : ""}
                    limit 10 offset ?

            `, params); // addio RAM       
            
            if(!query.results.length){
                await redis.set('notes', redis_query, "");
                return null;
            }

            let r = { result: debufferize(query.results), pages };
            let stringified = JSON.stringify(r) as string;
            await redis.set('notes', redis_query, stringified);

            return r;

        }catch(err){
            
            return Promise.reject(err);

        }

    },
    createFile: async(file: any, title: string, file_id: string, author_id: string) => {

        const file_path = `./public/notes/${author_id}/${file_id}/${file.name}`;
        file.mv(file_path);
        return file_path;
    
    },

    addNotes: async (author_id: string, title: string, file: any | any[], subject_id: number) => {

        if(isNaN(subject_id))
            return Promise.reject(false);
        
        let stuff = new Array();
        let jobs = new Array();
        let notes_id = crypto.randomBytes(64).toString('hex');

        if(!(file instanceof Array))
            stuff.push(file);
        else
            stuff = file.map(f => { return f });
        
        stuff.forEach(f => jobs.push(self.createFile(f, title, notes_id, author_id)));
        let results = await Promise.all(jobs);

        const q = await db.query(
            "INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, 0)",
            [notes_id, title, new Date(), `/public/notes/${author_id}/${notes_id}`, subject_id, author_id]
        );

        return { written_files: file.length, url: `/notes/${subject_id}/${notes_id}` };        

    },

    updateNote: async function (noteId: string, title: string, oldSubjectId: number, subjectId: number) {

        if(isNaN(subjectId) || isNaN(oldSubjectId))
            return Promise.reject(false);

        return await db.query(
            "UPDATE notes SET title = ?, subject_id = ? WHERE id = ? AND subject_id = ?",
            [title, subjectId, noteId, oldSubjectId]
        );
    },

    getNote: async function (id: string, subject_id: number, translateSubject: boolean) {
    
        const result = (await db.query(`
            SELECT 
                notes.id note_id, 
                notes.title, 
                notes.uploaded_at, 
                notes.storage_url, 
                notes.subject_id, 
                notes.author_id,
                notes.visits,
                aes_decrypt(users.name, ${ core.escape(process.env.AES_KEY!) }) as name, 
                aes_decrypt(users.surname, ${ core.escape(process.env.AES_KEY!) }) as surname
                ${translateSubject ? ", subjects.name subject_name" : ""} 
            FROM notes ${translateSubject ? "LEFT JOIN subjects ON subjects.id = notes.subject_id" : ""} 
            LEFT JOIN users ON notes.author_id = users.id
            WHERE notes.id = ? 
            AND notes.subject_id = ?`, [id, subject_id], true)).results;
        
        if(!result.length)
            return null;

        const release = await utils.mutex.acquire();

        try{

            await db.query(`
                UPDATE notes SET visits = visits + 1 WHERE subject_id = ? AND id = ?
            `, [subject_id, id]);

        }finally{

            await release();

        }        

        let files = await readdir(`./public/notes/${result[0].author_id}/${id}`);

        return result.length > 0 ? { result, files } : null;
    },

    getNotes: async function (start: number, subjectId?: number, authorId?: string, orderBy?: string, translateSubjects?: boolean, cache?: boolean) {

        /*

            todo: 
            le note vengono "paginate" di 10 in 10
            prendiamo un parametro start e in base a quello ritorniamo una porzione delle note totali

        */

        let redis_query = `${start}-${subjectId || 'allsubjects'}-${authorId || 'allauthors'}-${orderBy || 'anyorder'}-${translateSubjects || 'notranslate'}`
        
        if(!cache){
            let cached_item = await redis.get('notes', redis_query) as string;
        
            if(cached_item){
                console.log("cached");
                return JSON.parse(cached_item);
            }
        }

        let s = (start - 1) * 10; // pagine di 10 in 10 
        let count_params = new Array();
        

        if(subjectId)
            count_params.push(subjectId);
        
        if(authorId)
            count_params.push(authorId);

        let pages = Math.trunc((await db.query(`
                select count(*) as count from notes
                ${subjectId ? `where notes.subject_id = ?` : ''}
                ${authorId ? `where notes.author_id = ?` : ''}
            `, count_params)).results[0].count  / 10) + 1   

        if(start > pages)
            return { result: [], pages };   
        
        let query = `

            SELECT 
                notes.id note_id, 
                notes.title, 
                notes.uploaded_at, 
                notes.storage_url,
                notes.visits, 
                aes_decrypt(users.name, ${ core.escape(process.env.AES_KEY!) }) as name, 
                aes_decrypt(users.surname, ${ core.escape(process.env.AES_KEY!) }) as surname,
                notes.subject_id, 
                notes.author_id ${translateSubjects ? ", subjects.name subject_name" : ""} 
                FROM notes ${translateSubjects ? "JOIN subjects ON notes.subject_id = subjects.id" : ""} 
                JOIN users on users.id = notes.author_id 
                WHERE ${subjectId ? "notes.subject_id = ? AND" : ""}
                ${authorId ? "notes.author_id = ? AND" : "" }
                1 = 1
            ${orderBy ? ((orderBy.toLowerCase() === 'visits') ? "ORDER BY notes.visits DESC": ""): ""}
            ${orderBy ? ((orderBy.toLowerCase() === "asc" || orderBy.toLowerCase() === "desc") ? `ORDER BY notes.title ${orderBy}` : ""): ""}
            ${orderBy ? ((orderBy.toLowerCase() === "date") ? "ORDER BY notes.uploaded_at DESC": ""): ""}
                LIMIT 10 OFFSET ?
        `;

        let params: any[] = [];
        let cond: string[] = [];

        if (subjectId) params.push(subjectId);
        if (authorId) params.push(authorId);

        params.push(s);

        let result = (await db.query(query, params, true)).results

        if(!cache)
            await redis.set('notes', redis_query, JSON.stringify({result, pages}));

        return {result, pages};
    },

    deleteNote: async function (id: string, user_id: string, subject_id: number) {
       
        let s = await db.query("SELECT * FROM notes WHERE id = ? AND subject_id = ?", [id, subject_id]);
        
        if(s.results.length > 0){
            await db.query("DELETE FROM notes WHERE id = ? AND subject_id = ?", [id, subject_id]);
            rmdirSync(`./public/notes/${user_id}/${id}`, { recursive: true });
        }

        return s.results.length > 0;
    }
}

export default self;