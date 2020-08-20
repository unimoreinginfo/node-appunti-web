import db from "../db";
import path from "path";
import crypto from "crypto"

export default {
    addNote: async function (title: string, file: any, subjectId: number) {
        const authorId = (await db.query("SELECT id FROM users LIMIT 1")).results[0].id; // TODO!!! real shit, use the id of the user currently logged instead.

        const fileExt = path.extname(file.name);
        const fileId = crypto.randomBytes(64).toString("hex");
        const filePath = `./public/notes/${fileId}${fileExt}`;
        const fileUrl = `/public/notes/${fileId}${fileExt}`

        file.mv(filePath);

        return await db.query(
            "INSERT INTO notes (title, original_filename, uploaded_at, storage_url, subject_id, author_id) VALUES (?, ?, ?, ?, ?, ?)",
            [title, file.name, new Date(), fileUrl, subjectId, authorId]
        );
    },

    updateNote: async function (noteId: number, title: string, subjectId: number) {
        return await db.query(
            "UPDATE notes SET title=?, subject_id=? WHERE id=?",
            [title, subjectId, noteId]
        );
    },

    getNote: async function (id: number) {
        const res = (await db.query("SELECT * FROM notes WHERE id=?", id)).results;
        return res.length > 0 ? res[0] : undefined;
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
