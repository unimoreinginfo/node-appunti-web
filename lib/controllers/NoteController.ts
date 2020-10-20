import db, { core, debufferize } from "../db";
import path from "path";
import crypto from "crypto"
import { readdir, rmdirSync } from 'fs-extra';
import { User } from "./UserController";
import redis from '../redis'
import utils from '../utils'
 
const self = {
    
    search: async(query_string: string, page: number): Promise<string | null | Error> => {

        try{
            
            let cached = await redis.get('notes', `${query_string}-${page.toString()}`);
            if(cached){
                console.log(`returning cached result for query: ${query_string}-${page.toString()}`);
                return cached;
            }
            
            let s = (page - 1) * 10;
            console.log(s, s + 10);
            
            let query = await db.query(`
                SET @row = 0;
                
                select * from (
                    select (@row := @row + 1) as number,
                    notes.id, 
                    notes.title, 
                    notes.uploaded_at, 
                    notes.subject_id, 
                    notes.visits, 
                    notes.author_id,
                    aes_decrypt(users.name, ${ core.escape(process.env.AES_KEY!) }) as name, 
                    aes_decrypt(users.surname, ${ core.escape(process.env.AES_KEY!) }) as surname 
                    from notes left join users on notes.author_id = users.id) res
                    where res.title like ? and res.number > ? and res.number <= ?

            `, [`%${query_string}%`, s, s + 10], true); // addio RAM            
            
            if(!query.results[1].length){
                await redis.set('notes', `${query_string}-${page.toString()}`, "");
                return null;
            }
            
            let r = debufferize(query.results[1]);
            let stringified = JSON.stringify(r) as string;
            await redis.set('notes', `${query_string}-${page.toString()}`, stringified);

            return stringified;

        }catch(err){

            console.log(err);
            
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

        return q.results.affectedRows > 0;        

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
                notes.visits 
                ${translateSubject ? ", subjects.name subject_name" : ""} 
            FROM notes ${translateSubject ? "LEFT JOIN subjects ON subjects.id = notes.subject_id" : ""} 
            WHERE notes.id = ? 
            AND notes.subject_id = ?`, [id, subject_id])).results;
        
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

    getNotes: async function (start: number, subjectId?: number, authorId?: string, orderBy?: string, translateSubjects?: boolean) {

        /*

            todo: 
            le note vengono "paginate" di 10 in 10
            prendiamo un parametro start e in base a quello ritorniamo una porzione delle note totali

        */

        let s = (start - 1) * 10; // pagine di 10 in 10        
        
        // non abbiamo mysql 8 quindi non esiste row_number(), vabbe
        let query = `

            SET @row = 0;

            SELECT * FROM (
                SELECT (@row := @row + 1) as number,
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
            ) res
            WHERE 
            res.number > ? 
            AND res.number <= ?
            ${orderBy ? ((orderBy.toLowerCase() === "asc" || orderBy.toLowerCase() === "desc") ? `ORDER BY res.title ${orderBy}` : ""): ""}
        `;

        let params: any[] = [];
        let cond: string[] = [];

        if (subjectId) params.push(subjectId);
        if (authorId) params.push(authorId);

        params.push(s);
        params.push(s + 10)

        console.log(query);

        return await db.query(query, params);
    },

    deleteNote: async function (id: string, subject_id: number) {
       
        let s = await db.query("SELECT * FROM notes WHERE id = ? AND subject_id = ?", [id, subject_id]);
        console.log(id, s);
        
        if(s.results.length > 0){
            await db.query("DELETE FROM notes WHERE id = ? AND subject_id = ?", [id, subject_id]);
            rmdirSync(`./public/notes/${subject_id}/${id}`, { recursive: true });
        }

        return s.results.length > 0;
    }
}

export default self;