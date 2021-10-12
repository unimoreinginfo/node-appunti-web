import { expose } from "threads/worker";
import { Note } from "../../../lib/types";
import db from "../../../lib/db";
import utils from "../../../lib/utils";

const BATCH_SIZE = 40; // 40 richieste per volta

db.init();

const self = {
    async broadcastNote(note: Note){
        
        const urls = (await db.query("SELECT url FROM note_webhooks")).results;
        for(let b of utils.batch(urls, BATCH_SIZE)){
            console.log(b);
        }
    }
}

export type NoteWorker = typeof self;
expose(self);