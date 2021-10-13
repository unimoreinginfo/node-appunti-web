import { expose } from "threads/worker";
import { Note } from "../../../lib/types";
import db, { core } from "../../../lib/db";
import utils from "../../../lib/utils";
import axios from 'axios';
import { createHmac, createCipheriv, randomBytes } from "crypto";
import stringify from 'safe-json-stringify';

const BATCH_SIZE = 40; // 40 richieste per volta

db.init();

interface QueryResult {
    url: string,
    secret: string
}

const self = {
    async broadcastNote(note: Note) {

        try {
            const clients: QueryResult[] = (await db.query(`
            SELECT url,
            cast(aes_decrypt(unhex(client_secret), ${core.escape(process.env.AES_KEY)}) as char(64)) secret
            FROM notes_webhooks
            WHERE active = 1
        `)).results;

            const now = Date.now();

            for (let batch of utils.batch(clients, BATCH_SIZE)) {

                await Promise.all(batch.map(async(item) => {
                    await send(note, item.url, item.secret)
                }))
            }

            console.log((Date.now() - now) / 1000);
            

        }catch(err){

            console.log(err);

        }

    }
}

const send = async (note: Note, url: string, secret: string) => {

    const packet = pack(note, secret.substr(0, 32)).toString('utf-8');

    axios.post(url, { note }, {
        headers: {
            'X-Appunti-Digest': packet
        },
        timeout: 3500
    })
        .then(success => console.log(`ok ${url}`))
        .catch(err => {
            deactivateUrl(url)
        })

}

const deactivateUrl = async (url: string) => {

    await db.query("UPDATE notes_webhooks SET active = 0 WHERE BINARY url = ?", [url]);

}

const pack = (note: Note, secret: string) => {

    const hmac = createHmac('sha3-256', 'ciao');
    const date = parseInt((Date.now() / 1000).toString());
    const str_date = date.toString();
    const cipher = createCipheriv('aes-256-cbc', secret, randomBytes(16)); // randomBytes = initialization vector randomico
    const enc_text = Buffer.concat([cipher.update(str_date), cipher.final()]).toString('hex');

    hmac.update(stringify(note));
    const digest = hmac.digest('hex');
    const digest_buf = Buffer.from(digest),
        date_buf = Buffer.from(enc_text),
        colon_buf = Buffer.from(':');
    const packet = Buffer.concat([date_buf, colon_buf, digest_buf]);

    return packet;

}

export type NoteWorker = typeof self;
expose(self);