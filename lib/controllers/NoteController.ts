import db from "../db";
import path from "path";
import crypto from "crypto"
import { User } from "./UserController";

export default {
    addNote: async function (author_id: string, title: string, file: any, subjectId: number) {
        const file_ext = path.extname(file.name);
        const file_id = crypto.randomBytes(64).toString("hex");
        const file_path = `./public/notes/${file_id}${file_ext}`;
        const file_url = `/public/notes/${file_id}${file_ext}`

        file.mv(file_path);

        const result = await db.query(
            "INSERT INTO notes (title, original_filename, uploaded_at, storage_url, subject_id, author_id) VALUES (?, ?, ?, ?, ?, ?)",
            [title, file.name, new Date(), file_url, subjectId, author_id]
        );
        return result.results.affectedRows > 0;
    },

    updateNote: async function (noteId: number, title: string, subjectId: number) {
        return await db.query(
            "UPDATE notes SET title=?, subject_id=? WHERE id=?",
            [title, subjectId, noteId]
        );
    },

    getNote: async function (id: number) {
        const res = (await db.query("SELECT * FROM notes WHERE id=?", id)).results;
        return res.length > 0 ? res[0] : null;
    },

    getNotes: async function (subjectId?: number, authorId?: number, orderBy?: string) {
        let query = "SELECT * FROM notes";
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

        return await db.query(query, params);
    },

    deleteNote: async function (id: number) {
        return await db.query("DELETE FROM notes WHERE id=?", id);
    }
}
