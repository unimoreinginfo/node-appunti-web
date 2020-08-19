import db from "../db";

export default {
    updateUserInfo: async function (id: number, name: string, surname: string, password: string, unimoreId?: number) {
        return await db.query("UPDATE users SET name=? surname=? password=? unimoreId=? WHERE id=?", [
            name, surname, password, unimoreId, id
        ]);
    },

    createUser: async function (name: string, surname: string, email: string, password: string, admin: number, unimoreId?: number) {
        // TODO!!! Hash password pls
        return await db.query("INSERT INTO users (name, surname, email, password, admin, unimore_id) VALUES (?, ?, ?, ?, ?, ?)", [
            name, surname, email, password, admin, unimoreId
        ]);
    },

    getUser: async function (id: number) {
        return await db.query("SELECT * FROM users WHERE id=?", id);
    }
}
