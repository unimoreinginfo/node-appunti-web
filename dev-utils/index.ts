import db, { core } from '../lib/db';
import bcrypt from 'bcryptjs';
import WebhooksController from '../lib/controllers/WebhooksController';
import utils from '../lib/utils';

export const populateWebhooks = async() => {

    await db.query("UPDATE notes_webhooks SET active = 1");

    let thing = [...Array(10000).keys()]
    let work = new Array();

    for(let batch of utils.batch(thing, 1000)){

        batch.forEach(b => {
            work.push(
                WebhooksController.notes.create('poggers webhook', 'https://macca.cloud/webhook', {
                name: '',
                id: '1',
                surname: '',
                email: '',
                admin: 1,
                verified: 1
            }))
        });

        await Promise.all(work);
        work = [];

    }

}

export const createDummyUser = async() => {

    // createUser: async function (name: string, surname: string, email: string, password: string, admin: number, unimoreId?: number)
    db.query(`
            INSERT INTO users (id, name, surname, email, password, admin, unimore_id, verified) VALUES(
                ?,
                AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) }),
                AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) }),
                AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) }),
                ?,
                ?,
                AES_ENCRYPT(?, ${ core.escape(process.env.AES_KEY!) }),
                1
            )
        `, ['1', 'pongle', 'tonglis', 'test@test.com', await bcrypt.hash('poggers', 8), 1, 100000])
        .catch(err => console.log("already done"))

}