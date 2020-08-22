import db from "../db";
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
    unimoreId: number,
}

export default {
    isRegistered: async (email: string): Promise<boolean> => {

        return await db.query(`
        
            SELECT * FROM (
                SELECT AES_DECRYPT(email, ${ process.env.AES_KEY! }) email) AS result
            WHERE result.email = ?`, 
        
        [email]).results.length > 0; // key is escaped dont worryyyyyyy

    },

    createUser: async function (name: string, surname: string, email: string, password: string, admin: number, unimoreId?: number) {

        console.log("creating users");

        return await db.query(`
            INSERT INTO users VALUES(
                ?,
                AES_ENCRYPT(?, '${ process.env.AES_KEY! }'),
                AES_ENCRYPT(?, '${ process.env.AES_KEY! }'),
                AES_ENCRYPT(?, '${ process.env.AES_KEY! }'),
                ?,
                ?,
                AES_ENCRYPT(?, '${ process.env.AES_KEY! }')
            )
        `, [utils.generateUserId(), name, surname, email, await bcrypt.hash(password, 8), admin, unimoreId])

    },

    updateUser: async function (userId: string, name: string, surname: string, password: string, admin: number, unimoreId?: number) {
        const result = await db.query(`
            UPDATE users 
                SET 
                name = AES_ENCRYPT(?, '${ process.env.AES_KEY! }'), 
                surname = AES_ENCRYPT(?, '${ process.env.AES_KEY! }'), 
                password = ?,
                admin = ?, 
                unimore_id = AES_ENCRYPT(?, '${ process.env.AES_KEY! }') 
            WHERE id = ?`, 
            [name, surname, await bcrypt.hash(password, 8), admin, unimoreId, userId
        ]);
        return result.results.affectedRows > 0;
    },

    getUser: async function (userId: string): Promise<User> {
        let users = (await db.query(`SELECT  
                id, 
                admin,
                AES_DECRYPT(name, '${ process.env.AES_KEY! }') name, 
                AES_DECRYPT(surname, '${ process.env.AES_KEY! }') surname,  
                AES_DECRYPT(email, '${ process.env.AES_KEY! }') email, 
                AES_DECRYPT(unimore_id, '${ process.env.AES_KEY! }') unimoreId
                FROM users WHERE id = ?
            `, [userId], true));

        return users.results[0];
    },

    getUserByEmail: async function (email: string): Promise<User> {
        let user = (await db.query(`SELECT * FROM
                ( SELECT 
                    id, 
                    password,
                    AES_DECRYPT(name, '${ process.env.AES_KEY! }') name, 
                    AES_DECRYPT(surname, '${ process.env.AES_KEY! }') surname,  
                    AES_DECRYPT(email, '${ process.env.AES_KEY! }') email, 
                    AES_DECRYPT(unimore_id, '${ process.env.AES_KEY! }') unimoreId FROM users )
                T
                WHERE T.email = ?
            `, [email], true));
        
        return user.results[0];
    },

    getUsers: async function (): Promise<User[]> {
        let users = (await db.query(`SELECT  
                id, 
                AES_DECRYPT(name, '${ process.env.AES_KEY! }') name, 
                AES_DECRYPT(surname, '${ process.env.AES_KEY! }') surname,  
                AES_DECRYPT(email, '${ process.env.AES_KEY! }') email, 
                AES_DECRYPT(unimore_id, '${ process.env.AES_KEY! }') unimoreId
                FROM users
            `, [], true));

        return users.results;
        
    }
}
