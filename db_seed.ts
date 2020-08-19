import db from "./lib/db"
import * as dotenv from "dotenv";

import SubjectController from "./lib/controllers/SubjectController";

dotenv.config();

db.init();

Promise.all([
    async function () {
        await SubjectController.truncate();
        await Promise.all([
            SubjectController.createSubject("Analisi I", "Maria", "Manfredini"),
            SubjectController.createSubject("Fondamenti di Informatica I", "Costantino", "Grana"),
            SubjectController.createSubject("Geometria", "Maria Rita", "Casali"),
            
            SubjectController.createSubject("Fisica Generale", "Raffaella", "Capelli"),
            SubjectController.createSubject("Economia ed Organizzazione aziendale", "Giulia", "Tagliazucchi"),
            SubjectController.createSubject("Fondamenti di Informatica II", "Maurizio", "Vincini"),
            SubjectController.createSubject("Matematica Statistica e Applicata", "Marco", "Maioli")
        ]);
    }
]).then(() => {
    console.log("DB seeded");
});
