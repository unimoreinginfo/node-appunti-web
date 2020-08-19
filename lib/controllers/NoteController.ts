import db from "../db";

import crypto from "crypto"

function getNoteFileUrl(fileId: string) {
    return `/public/notes/${fileId}.pdf`;
}

function storeNoteFile(file: any) {
    const fileId = crypto.randomBytes(64).toString("hex");
    file.mv(`./public/notes/${fileId}.pdf`);
    return fileId;
}

export default {
    addNote: async function (title: string, file: any, subjectId: number) {
        const authorId = (await db.query("SELECT id FROM users LIMIT 1")).results[0].id; // TODO!!! real shit, use the id of the user currently logged in instead.
        const fileId = storeNoteFile(file);

        return await db.query(
            "INSERT INTO notes (title, original_filename, uploaded_at, storage_url, subject_id, author_id) VALUES (?, ?, ?, ?, ?, ?)",
            [title, file.name, new Date(), getNoteFileUrl(fileId), subjectId, authorId]
        );
    },

    getNote: async function (id: number) {
        return await db.query("SELECT * FROM notes WHERE id=?", id);
    },

    getNotes: async function (subjectId?: number, authorId?: number, orderBy?: string) {
        let queryStr = "SELECT * FROM notes WHERE 1=1"; // 1=1 to use AND from now on... >:c
        let params: any[] = [];

        if (subjectId) {
            queryStr += " AND subject_id=?";
            params.push(subjectId);
        }

        if (authorId) {
            queryStr += " AND author_id=?";
            params.push(authorId);
        }

        if (orderBy) {
            queryStr += " ORDER BY ?";
            params.push(orderBy);
        }

        return await db.query(queryStr, params);
    },

    deleteNote: async function (id: number) {
        return await db.query("DELETE FROM notes WHERE id=?", id);
    }
}
