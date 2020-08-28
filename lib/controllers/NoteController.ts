import db from "../db";
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

                SELECT id,title FROM notes WHERE title LIKE ?

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
    createFile: async(file: any, title: string, file_id: string, subjectId: number, author_id: string) => {

        const file_path = `./public/notes/${file_id}/${file.name}`;
        file.mv(file_path);
        return file_path;
    
    },

    addNotes: async (author_id: string, title: string, file: any | any[], subjectId: number) => {
        
        let stuff = new Array();
        let jobs = new Array();
        let notes_id = crypto.randomBytes(64).toString('hex');

        if(!(file instanceof Array))
            stuff.push(file);
        else
            stuff = file.map(f => { return f });
        
        stuff.forEach(f => jobs.push(self.createFile(f, title, notes_id, subjectId, author_id)));
        let results = await Promise.all(jobs);

        const q = await db.query(
            "INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?)",
            [notes_id, title, new Date(), `/public/notes/${notes_id}`, subjectId, author_id]
        );

        return q.results.affectedRows > 0;        

    },

    updateNote: async function (noteId: number, title: string, subjectId: number) {
        return await db.query(
            "UPDATE notes SET title=?, subject_id=? WHERE id=?",
            [title, subjectId, noteId]
        );
    },

    getNote: async function (id: string, translateSubject: boolean) {
        const result = (await db.query(`SELECT notes.id note_id, notes.title, notes.uploaded_at, notes.storage_url, notes.subject_id, notes.author_id ${translateSubject ? ", subjects.name subject_name" : ""} FROM notes ${translateSubject ? "LEFT JOIN subjects ON subjects.id = notes.subject_id" : ""} WHERE notes.id=?`, id)).results;
        
        if(!result.length)
            return null;

        let files = await readdir(`./public/notes/${id}`);

        return result.length > 0 ? { result, files } : null;
    },

    getNotes: async function (subjectId?: number, authorId?: number, orderBy?: string, translateSubjects?: boolean) {
        let query = `SELECT notes.id note_id, notes.title, notes.uploaded_at, notes.storage_url, notes.subject_id, notes.author_id ${translateSubjects ? ", subjects.name subject_name" : ""} FROM notes`;
        let params: any[] = [];
        let cond: string[] = [];

        if (subjectId) {
            cond.push("subject_id=?");
            params.push(subjectId);
        }

        if (authorId) {
            cond.push("author_id=?");
            params.push(authorId);
        }

        if (cond.length > 0) {
            query += " WHERE " + cond.join(" AND ");
        }

        if (orderBy && (orderBy.toLowerCase() === "asc" || orderBy.toLowerCase() === "desc")) {
            query += " ORDER BY title " + orderBy;
            params.push(orderBy);
        }

        if(translateSubjects){
            query += `
                JOIN subjects ON notes.subject_id = subjects.id
            `
        }

        return await db.query(query, params);
    },

    deleteNote: async function (id: string) {
        let result = await db.query("DELETE FROM notes WHERE id = ?", id);
        console.log(id, result);
        
        if(result.results.affectedRows > 0)
            rmdirSync(`./public/notes/${id}`, { recursive: true })

        return result.affectedRows > 0;
    }
}

export = self;