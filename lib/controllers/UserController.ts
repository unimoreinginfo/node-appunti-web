import db, { core, debufferize } from "../db";
import utils from "../utils"
import bcrypt = require("bcryptjs");
import { mkdir } from "fs-extra"
import redis from "../redis";
import { spawn } from 'child_process'
import { Request, Response, NextFunction } from 'express';
import HTTPError from "../HTTPError";
import Mail from "../Mail";
import path from 'path';
import { randomBytes } from 'crypto'
 
export interface User{
    id: string,
    name: string,
    surname: string,
    email: string,
    admin: number,
    verified: number,
    password?: string,
    unimore_id?: number,
};

const self =  {
    hashPassword: async (password: string) => await bcrypt.hash(password, 8),

    updateUnimoreId: async(user_id: string, unimore_id: number) => {

        await db.query("UPDATE users SET unimore_id = ? WHERE id = ?", [unimore_id, user_id]);
    
    },
    
    isUserVerified: async(user_id: string): Promise<boolean> => {

        let user = await self.getUser(user_id);
        if(!user)
            return false;
        
        return user.verified > 0;

    },

    createConfirmationToken: async(user_id: string): Promise<string | null> => {

        let user = await self.getUser(user_id);
        if(!user)
            return null;
        
        let token = randomBytes(64).toString('hex');
        await db.query("INSERT INTO verification_tokens values(?, ?)", [user_id, token]);

        return token;

    },

    getConfirmationToken: async(user_id: string): Promise<string | null> => {

        let token = (await db.query("SELECT token FROM verification_tokens WHERE id = ?", [user_id]));
        if(!token.results)
            return null;
        
        return token.results[0].token;

    },

    verifyConfirmationPair: async(user_id: string, token: string): Promise<boolean> => {

        let pair = (await db.query("SELECT * FROM verification_tokens WHERE id = ? AND token = ?", [user_id, token]));
        await db.query("DELETE FROM verification_tokens WHERE id = ? AND token = ?", [user_id, token]);
        return pair.results.length > 0;

    },

    updateVerificationStatus: async(user_id: string) => {

        await db.query("UPDATE users SET verified = 1 WHERE id = ?", [user_id]);

    },
    
    sendConfirmationEmail: async(user_id: string): Promise<void> => {

        let user = await self.getUser(user_id);
        if(!user || !user.unimore_id)
            return;

        let token = await self.getConfirmationToken(user_id);

        let mail = new Mail(`${user.unimore_id}@studenti.unimore.it`, 'Conferma la tua identità', path.resolve('templates/confirm.html'), {
            name: user.name,
            link: `${process.env.URI}/auth/verify/${token}/${user_id}`
        });

        await mail.send();

    },

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
                    console.log(size);
                    
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
        
            SELECT AES_DECRYPT(email, ${ core.escape(process.env.AES_KEY!) }) email FROM users 
            HAVING email = ?`, 
        
        [email])).results.length > 0;
        

    },

    createUser: async function (name: string, surname: string, email: string, password: string, admin: number, unimoreId?: number): Promise<User> {

        let id = utils.generateUserId();

        await db.query(`
            INSERT INTO users (id, name, surname, email, password, admin, unimore_id) VALUES(
                ?,
                AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) }),
                AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) }),
                AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) }),
                ?,
                ?,
                AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) })
            )
        `, [id, name, surname, email, await bcrypt.hash(password, 8), admin, unimoreId]);

        await mkdir(`./public/notes/${id}`);

        return { id, name, surname, email, password, admin, unimore_id: unimoreId, verified: 0}

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
                verified,
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
                verified,
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
                    verified,
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

    getUsers: async function (start: number) {

        let s = (start - 1) * 10;


        let pages = Math.trunc((await db.query(`
                select count(*) as count from users`)).results[0].count  / 10) + 1   


        let users = (await db.query(`
            SELECT 
                id, 
                admin,
                verified,
                AES_DECRYPT(name, ${ core.escape(process.env.AES_KEY!) }) name, 
                AES_DECRYPT(surname, ${ core.escape(process.env.AES_KEY!) }) surname,  
                AES_DECRYPT(email, ${ core.escape(process.env.AES_KEY!) }) email, 
                AES_DECRYPT(unimore_id, ${ core.escape(process.env.AES_KEY!) }) unimore_id
                FROM users
            LIMIT 10 OFFSET ?
            `, [s]))
        
        return {pages: pages, result: debufferize(users.results)};
        
    },

    deleteUser: async function(user_id: string) {
        let result = await db.query(`DELETE FROM users WHERE id=?`, [user_id]);
        return result.results.affectedRows > 0;
    }
}

export default self;