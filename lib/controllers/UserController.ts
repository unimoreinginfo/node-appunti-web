import db from "../db";
import bcrypt = require("bcryptjs");
import crypto from "crypto";

export default {

    isRegistered: async(email: string): Promise<boolean> => {

        return await db.query("SELECT * FROM users WHERE email = ?", [email]).results.length;

    },
    updateUserInfo: async function (id: number, name: string, surname: string, password: string, unimoreId?: number) {
        return await db.query("UPDATE users SET name=? surname=? password=? unimoreId=? WHERE id=?", [
            name, surname, password, unimoreId, id
        ]);
    },

    createUser: async function (name: string, surname: string, email: string, password: string, admin: number, unimoreId?: number) {
        try{
            let user_id = crypto.randomBytes(32).toString('hex'); // per gli utenti mi piace di più un bell'id fatto così piuttosto che un numero, sorry...
            let hash = await bcrypt.hash(password, 8); // 8 rounds are fine i guess
            return await db.query("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", [
                user_id, name, surname, email, password, admin, unimoreId
            ]);

        }catch(err){

            throw err;

        }
    },

    getUser: async function (id: string) {
        return await db.query("SELECT * FROM users WHERE id=?", id);
    }
}
