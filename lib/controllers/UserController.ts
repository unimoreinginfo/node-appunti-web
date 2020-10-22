import db, { core, debufferize } from "../db";
import utils from "../utils"
import bcrypt = require("bcryptjs");
import crypto from "crypto";
import { mkdir } from "fs-extra"
import redis from "../redis";
import { spawn } from 'child_process'

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

    getUserSize: async(user_id: string): Promise<number> => {

        let query = await db.query("SELECT size FROM users WHERE id = ?", [user_id]);
        return parseInt(query.results[0].size);

    },

    setUserSize: (user_id: string): Promise<boolean> => {

        return new Promise(
            (resolve, reject) => {

                // the linux way
                let size_command = spawn(`du`, [`./public/notes/${user_id}`, '-sh', '--bytes'])
                let size: number;

                size_command.stdout.once('data', async(data) => {
            
                    size = parseInt(data.toString('utf-8').split("\t")[0]);
                    await db.query('UPDATE users SET size = ? WHERE id = ?', [size, user_id]);

                    return resolve(true)

                });

                size_command.stderr.once('data', data => {

                    return reject(false);

                })
            
            }
        )

    },

    isRegistered: async (email: string): Promise<boolean> => {

        return (await db.query(`
        
            SELECT  AES_DECRYPT(email, ${ core.escape(process.env.AES_KEY!) }) email FROM users 
            HAVING result.email = ?`, 
        
        [email])).results.length > 0;
        

    },

    createUser: async function (name: string, surname: string, email: string, password: string, admin: number, unimoreId?: number) {

        let id = utils.generateUserId();

        await mkdir(`./public/notes/${id}`);

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
        `, [id, name, surname, email, await bcrypt.hash(password, 8), admin, unimoreId])

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
            if (params[key] == null) {
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

    getUser: async function (userId: string): Promise<User | null> {
        let users = (await db.query(`SELECT  
                id, 
                admin,
                AES_DECRYPT(name, ${ core.escape(process.env.AES_KEY!) }) name, 
                AES_DECRYPT(surname, ${ core.escape(process.env.AES_KEY!) }) surname,  
                AES_DECRYPT(email, ${ core.escape(process.env.AES_KEY!) }) email, 
                AES_DECRYPT(unimore_id, ${ core.escape(process.env.AES_KEY!) }) unimore_id
                FROM users WHERE id = ?
            `, [userId], true));

        if(users.results.length == 0)
            return null;

        return users.results[0];
    },

    getUserFull: async function (userId: string): Promise<User | null> {
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

        if(!users.results.length)
            return null

        return users.results[0];
    },

    getUserByEmail: async function (email: string): Promise<User | null> {
        let user = (await db.query(`
                SELECT 
                    id, 
                    admin,
                    password,
                    AES_DECRYPT(name, ${ core.escape(process.env.AES_KEY!) }) name, 
                    AES_DECRYPT(surname, ${ core.escape(process.env.AES_KEY!) }) surname,  
                    AES_DECRYPT(email, ${ core.escape(process.env.AES_KEY!) }) email, 
                    AES_DECRYPT(unimore_id, ${ core.escape(process.env.AES_KEY!) }) unimoreId FROM users 
                HAVING email = ?
            `, [email], true));
        
        if(!user.results.length)
            return null

        return user.results[0];
    },

    getUsers: async function (start: number): Promise<User[] | null> {

        let s = (start - 1) * 10;
        let users = (await db.query(`
            SELECT 
                id, 
                admin,
                AES_DECRYPT(name, ${ core.escape(process.env.AES_KEY!) }) name, 
                AES_DECRYPT(surname, ${ core.escape(process.env.AES_KEY!) }) surname,  
                AES_DECRYPT(email, ${ core.escape(process.env.AES_KEY!) }) email, 
                AES_DECRYPT(unimore_id, ${ core.escape(process.env.AES_KEY!) }) unimore_id
                FROM users
            LIMIT 10 OFFSET ?
            `, [s]))
        
        if(!users.results.length)
            return null

        return debufferize(users.results);
        
    },

    deleteUser: async function(user_id: string) {
        let result = await db.query(`DELETE FROM users WHERE id=?`, [user_id]);
        return result.results.affectedRows > 0;
    }
}
