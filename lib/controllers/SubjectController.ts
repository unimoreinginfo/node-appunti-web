import db from "../db";

export default {
    truncate: async function () {
        await db.query("DELETE FROM subjects");
        await db.query("ALTER TABLE subjects AUTO_INCREMENT = 1");
    },

    createSubject: async function (name: string, professorName: string, professorSurname: string) {
        return await db.query("INSERT INTO subjects (name, professor_name, professor_surname) VALUES (?, ?, ?)", [
            name, professorName, professorSurname
        ]);
    },
    
    getSubjects: async function () {
        return await db.query("SELECT * FROM subjects");
    }
}
