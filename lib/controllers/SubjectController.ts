import db from "../db";

export default {
    truncate: async function () {
        return await db.query("DELETE FROM subjects");
    },

    createSubject: async function (name: string, professorName: string, professorSurname: string) {
        return await db.query("INSERT INTO subjects (name, professor_name, professor_surname) VALUES (?, ?, ?)", [
            name, professorName, professorSurname
        ]);
    },

    removeSubject: async function (subjectId: number) {
        return await db.query("DELETE FROM subjects WHERE id=?", subjectId);
    },

    getSubjects: async function () {
        return await db.query("SELECT * FROM subjects");
    }
}
