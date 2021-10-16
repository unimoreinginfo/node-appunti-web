import { expose } from "threads/worker";
import { Note } from "../../../lib/types";
import db, { core, newConnection } from "../../../lib/db";
import axios from 'axios';
import { createHmac, createCipheriv, randomBytes } from "crypto";
import stringify from 'safe-json-stringify';
import { PossibleWorker } from "../../../lib/WorkerPool";
import { Query } from "mysql2";
import Sntp from "sntp";

db.init();

interface QueryResult {
    url: string,
    secret: string
}

/**
 * Possibile miglioramento:
 * wrappare questa roba dentro una classe che estende event emitter in modo tale che si possano usare gli
 * eventi per notificare la WorkerPool, così evitiamo il await this.wait() dentro WorkerPool.ts
 * in modo tale da non stressare troppo l'event loop
 * 
 * Questo metodo va bene per ~5/6000 webhooks, numero tremendamente alto e che mai raggiungeremo,
 * ma comunque guardare una soluzione scalabile non sarebbe male (con > 30000 rows inizia a fare fatica)
 * 
 */

const self = {
    async broadcast(note: Note) {

        try {
                        
            const conn = newConnection();
            
            const stream = conn.query(`
                SELECT url,
                cast(aes_decrypt(unhex(client_secret), ${core.escape(process.env.AES_KEY)}) as char(64)) secret
                FROM notes_webhooks
                WHERE active = 1`
            );

            try{

                const t1 = parseInt((Date.now() / 1000).toFixed(2))
                await work(stream, note); 
                const t2 = parseInt((Date.now() / 1000).toFixed(2))

                console.log(`${ t2 - t1 }s -> ${conn.threadId}`);
                
                conn.end(); 
            }catch(err){
                console.log(err);
            }

        }catch(err){

            console.log(err);

        }

    }
}

const work = async(stream: Query, note: Note) => {

    return new Promise(
        (resolve, reject) => {
            stream.on('error', err => { 
                console.log("stream err: " + err);
                reject(err) 
            });
            stream.on('result', async (webhook: QueryResult) => send(note, webhook.url, webhook.secret));   
            stream.on('end', (err) => { 
                
                if(err) { console.log("end err " + err); return reject(err); }
                return resolve(true);
            })

        }
    ) 

}

const send = async (note: Note, url: string, secret: string) => {

    const pkg = await pack(note, secret.substr(0, 32));
    const packed_data = pkg.packet.toString('utf-8');
    const packed_iv = pkg.init_vector.toString('hex');

    axios.post(url, { note }, {
        headers: {
            'X-Appunti-Digest': packed_data,
            'X-Appunti-IV': packed_iv
        },
        timeout: 3500
    }).catch(_ => deactivateUrl(url))

}

const deactivateUrl = async (url: string) => {

    await db.query("START TRANSACTION");
    await db.query("UPDATE notes_webhooks SET active = 0 WHERE BINARY url = ?", [url]);
    await db.query("COMMIT");
}

const pack = async(note: Note, secret: string) => {
   
    const hmac = createHmac('sha3-256', secret);
    const sntp_time = await Sntp.time();
    const date = parseInt((sntp_time.receiveTimestamp / 1000).toString());
    const str_date = date.toString();
    const init_vector = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', secret, init_vector);
    const enc_text = Buffer.concat([cipher.update(str_date), cipher.final()]).toString('hex');    

    hmac.update(stringify(note));
    const digest = hmac.digest('hex');
    const digest_buf = Buffer.from(digest),
        date_buf = Buffer.from(enc_text),
        colon_buf = Buffer.from(':');
    const packet = Buffer.concat([date_buf, colon_buf, digest_buf]);   

    return { packet, init_vector };

}

export type NoteWorker = PossibleWorker;
expose(self);