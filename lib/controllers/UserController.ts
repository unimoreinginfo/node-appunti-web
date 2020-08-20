import db from "../db";
import bcrypt = require("bcryptjs");
import crypto from "crypto";

export default {
    isRegistered: async (email: string): Promise<boolean> => {
        return await db.query("SELECT * FROM users WHERE email = ?", [email]).results.length;
    },

    generateUserId: () => crypto.randomBytes(32).toString('hex'),

    hashPassword: async (password: string) => await bcrypt.hash(password, 8),

    createUser: async function (name: string, surname: string, email: string, password: string, admin: number, unimoreId?: number) {
        return await db.query("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", [
            this.generateUserId(), name, surname, email, this.hashPassword(password), admin, unimoreId
        ]);
    },

    updateUser: async function (userId: string, name: string, surname: string, password: string, admin: number, unimoreId?: number) {
        const result = await db.query("UPDATE users SET name=?, surname=?, password=?, admin=?, unimore_id=? WHERE id=?", [
            name, surname, await this.hashPassword(password), admin, unimoreId, userId
        ]);
        return result.results.affectedRows > 0;
    },

    getUser: async function (userId: string) {
        return (await db.query("SELECT * FROM users WHERE id=?", userId)).results;
    },

    getUsers: async function () {
        return (await db.query("SELECT * FROM users")).results;
    }
}
