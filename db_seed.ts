import db from "./lib/db"
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs"

import SubjectController from "./lib/controllers/SubjectController";
import UserController from "./lib/controllers/UserController";
import AuthController from "./lib/controllers/AuthController";

dotenv.config();

db.init();

Promise.all([
    (async () => {
        await AuthController.truncateSessions();
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

        console.log("Subjects seeded");
    })(),
    (async () => {
        const users = [
            ["Lorenzo", "Rutayisire", "loryruta23@gmail.com", await bcrypt.hashSync("nana", 8), 1, 272281],
            ["Emiliano", "Maccaferri", "inbox@emilianomaccaferri.com", await bcrypt.hashSync("nana", 8), 1, 272244]
        ];

        await db.query("DELETE FROM users");
        await Promise.all(users.map(async (user: any[]) => {
            (<any>UserController.createUser)(...user);
        }));

        console.log("Users seeded");
    })()
]).then(() => {
    console.log("Seeding done");
}).catch(err => {
    console.error(err);
});
