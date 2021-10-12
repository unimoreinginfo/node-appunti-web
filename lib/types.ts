import { ModuleThread, Pool } from "threads";
import { NoteWorker } from "../workers/webhooks/notes/broadcast";

export interface Note{
    id: string,
    title: string,
    uploaded_at: Date,
    storage_url: string,
    subject_id: number,
    author_id: string,
    visits: number,
    written_files?: number
}
export interface Pools{
    notes: Pool<ModuleThread<NoteWorker>>
}