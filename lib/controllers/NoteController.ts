import db, { core } from "../db";
import path from "path";
import crypto from "crypto"
import { readdir, rmdirSync } from 'fs-extra';
import { User } from "./UserController";
import redis from '../redis'

const self = {
    
    search: async(query_string: string): Promise<string | null | Error> => {

        try{

            let cached = await redis.get('notes', query_string);
            if(cached){
                console.log(`returning cached result for query: ${query_string}`);
                return cached;
            }

            let query = await db.query(`

                SELECT id, title, subject_id FROM notes WHERE title LIKE ?

            `, [`%${query_string}%`]); // output ridotto, devo tenere sta roba in RAM, quindi...

            if(!query.results.length) 
                return null;

            let stringified = JSON.stringify(query.results) as string;
            await redis.set('notes', query_string, stringified);

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
                notes.author_id 
                ${translateSubject ? ", subjects.name subject_name" : ""} 
            FROM notes ${translateSubject ? "LEFT JOIN subjects ON subjects.id = notes.subject_id" : ""} 
            WHERE notes.id = ? 
            AND notes.subject_id = ?`, [id, subject_id])).results;
        
        if(!result.length)
            return null;

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
                notes.subject_id, 
                notes.author_id ${translateSubjects ? ", subjects.name subject_name" : ""} 
            FROM notes ${translateSubjects ? "JOIN subjects ON notes.subject_id = subjects.id" : ""}  
                WHERE ${subjectId ? "notes.subject_id = ? AND" : ""}
                ${authorId ? "notes.author_id = ? AND" : "" }
                1 = 1
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