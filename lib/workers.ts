import { Pool, spawn, Worker } from "threads";
import { NoteWorker } from "../workers/webhooks/notes/broadcast";
import db from './db'

export default {
    notes: Pool(() => 
        spawn<NoteWorker>(
            new Worker('../../workers/webhooks/notes/broadcast.ts')
        ), 10
    )
}