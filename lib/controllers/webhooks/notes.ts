import axios from 'axios';
import db, { core } from '../../db';
import bcrypt from 'bcryptjs';

import {
    randomBytes
} from 'crypto'
import { User } from '../UserController';

const self = {
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