import axios from 'axios';
import db, { core, WrappedConnection } from '../../db';
import bcrypt from 'bcryptjs';

import {
    randomBytes
} from 'crypto'
import { User } from '../UserController';

const self = {

    async byUser(user: User, connection?: WrappedConnection){

        const conn = await db.getConnection(connection);

        try{

            const webhooks = (await conn.query(`
                SELECT title, 
                    client_id, 
                    cast(aes_decrypt(unhex(client_secret), ${core.escape(process.env.AES_KEY)}) as char(32)) as client_secret
                    FROM notes_webhooks WHERE owner = ?
                `, [user.id])).results;

            if(!connection) await conn.release();
            
            return webhooks;

            
        }catch(err){

            await conn.query("ROLLBACK");
            if(!connection) await conn.release();
            return Promise.reject(err);

        }

    },

    async create(webhook_title: string, webhook_url: string, user: User){
        
        const conn = await db.getConnection();

        try{
            
            await conn.query("START TRANSACTION");
            const client_id = randomBytes(16).toString('hex'),
                client_secret = randomBytes(16).toString('hex');
            
            await conn.query(`INSERT INTO notes_webhooks VALUES(?, ?, ?, HEX(AES_ENCRYPT(?, ${core.escape(process.env.AES_KEY)})), 1, ?)`, [
                client_id,
                webhook_title,
                webhook_url,
                client_secret,
                user.id
            ])

            await conn.query("COMMIT");
            await conn.release();

            return { client_id, client_secret }

        }catch(err){

            await conn.release();
            return Promise.reject(err);

        }

    }
}

export default self;