import db, { core } from "../db";
import utils from "../utils"
import bcrypt = require("bcryptjs");
import crypto from "crypto";

export interface User{
    id: string,
    name: string,
    surname: string,
    email: string,
    admin: number,
    password?: string,
    unimore_id?: number,
};

export default {
    hashPassword: async (password: string) => await bcrypt.hash(password, 8),

    isRegistered: async (email: string): Promise<boolean> => {

        return (await db.query(`
        
            SELECT * FROM (
                SELECT AES_DECRYPT(email, ${ core.escape(process.env.AES_KEY!) }) email FROM users) AS result
            WHERE result.email = ?`, 
        
        [email])).results.length > 0;
        

    },

    createUser: async function (name: string, surname: string, email: string, password: string, admin: number, unimoreId?: number) {
        return await db.query(`
            INSERT INTO users VALUES(
                ?,
                AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) }),
                AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) }),
                AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) }),
                ?,
                ?,
                AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) })
            )
        `, [utils.generateUserId(), name, surname, email, await bcrypt.hash(password, 8), admin, unimoreId])

    },

    updateUser: async function (user_id: string, name?: string, surname?: string, password?: string, unimore_id?: number, admin?: number) {
        const params = {
            name,
            surname,
            password: password ? await bcrypt.hash(password, 8) : undefined,
            unimore_id,
            admin
        };
        const values = {
            name: `AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) })`,
            surname: `AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) })`,
            password: `?`,
            unimore_id: `AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) })`,
            admin: `?`
        };
        const updates: string[] = [];
        for (const [key, val] of Object.entries(values)) {
            if (params[key] === undefined) {
                delete params[key];
                continue;
            }
            updates.push(`${key} = ${val}`);
        }
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        const query_params = [...Object.values(params), user_id];
        const result = await db.query(query, query_params);
        return result.results.affectedRows > 0;
    },

    updateUserPassword: async function (user_id: string, new_password: string) {
        const result = await db.query(`
            UPDATE users
                SET password = ?
                WHERE id = ?
        `, [
            await bcrypt.hash(new_password, 8),
            user_id
        ]);
        return result.results.affectedRows > 0;
    },

    getUser: async function (userId: string): Promise<User> {
        let users = (await db.query(`SELECT  
                id, 
                admin,
                password,
                AES_DECRYPT(name, ${ core.escape(process.env.AES_KEY!) }) name, 
                AES_DECRYPT(surname, ${ core.escape(process.env.AES_KEY!) }) surname,  
                AES_DECRYPT(email, ${ core.escape(process.env.AES_KEY!) }) email, 
                AES_DECRYPT(unimore_id, ${ core.escape(process.env.AES_KEY!) }) unimore_id
                FROM users WHERE id = ?
            `, [userId], true));

        return users.results[0];
    },

    getUserByEmail: async function (email: string): Promise<User> {
        let user = (await db.query(`SELECT * FROM
                ( SELECT 
                    id, 
                    admin,
                    password,
                    AES_DECRYPT(name, ${ core.escape(process.env.AES_KEY!) }) name, 
                    AES_DECRYPT(surname, ${ core.escape(process.env.AES_KEY!) }) surname,  
                    AES_DECRYPT(email, ${ core.escape(process.env.AES_KEY!) }) email, 
                    AES_DECRYPT(unimore_id, ${ core.escape(process.env.AES_KEY!) }) unimoreId FROM users )
                T
                WHERE T.email = ?
            `, [email], true));
        
        return user.results[0];
    },

    getUsers: async function (): Promise<User[]> {
        let users = (await db.query(`SELECT  
                id, 
                admin,
                password,
                AES_DECRYPT(name, ${ core.escape(process.env.AES_KEY!) }) name, 
                AES_DECRYPT(surname, ${ core.escape(process.env.AES_KEY!) }) surname,  
                AES_DECRYPT(email, ${ core.escape(process.env.AES_KEY!) }) email, 
                AES_DECRYPT(unimore_id, ${ core.escape(process.env.AES_KEY!) }) unimore_id
                FROM users
            `, [], true));

        return users.results;
        
    }
}
