import axios from 'axios';
import db from '../../db';
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
            const client_id = randomBytes(32).toString('hex'),
                client_secret = randomBytes(32).toString('hex');
            
            await conn.query("INSERT INTO note_webhooks VALUES(?, ?, ?, ?, ?, 1)", [
                client_id,
                webhook_title,
                webhook_url,
                await bcrypt.hash(client_secret, 8),
                user.id
            ])

            await conn.query("COMMIT");
            await conn.release();

            return { client_id, client_secret }

        }catch(err){

            await conn.release();
            Promise.reject(err);

        }

    }
}

export default self;