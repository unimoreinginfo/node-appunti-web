import db from "../db";
import {
    mkdir
} from 'fs-extra';

export interface Subject {
    name: string,
    professor_name: string,
    professor_surname: string
}

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
    
    getSubject: async function (subject_id: number): Promise<Subject | null> {
        const result = await db.query("SELECT * FROM subjects WHERE id = ?", [subject_id]);       

        if(!result.results.length)
            return null;

        return result.results[0];
    },

    getSubjects: async function () {
        return await db.query("SELECT * FROM subjects ORDER BY name");
    }
}
