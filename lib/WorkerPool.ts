import { TypedEmitter } from 'tiny-typed-emitter';
import { Pool, spawn, Thread, Worker } from "threads";
import { NoteWorker } from "../workers/webhooks/notes/broadcast";
import { Note } from './types';
import { WorkerModule } from 'threads/dist/types/worker';
import { randomBytes } from 'crypto';

type PossibleJob = Note;
interface Possible{
    'job': (item: PossibleJob) => void;
    'ready': () => void;
}
export interface PossibleWorker extends WorkerModule<any> {
    broadcast: (item: PossibleJob) => void;
}

export class WorkerPool<Y extends PossibleJob> extends TypedEmitter<Possible> {

    /*
        non posso fare WorkerPool<T extends PossibleWorker> perché sta lib ha un modo di gestire i tipi orrendo
        non c'è documentazione a riguardo, non posso fare una classe WorkerThread che estende i tipi della libreria perché non è documentato nulla

        boh vabbè ok
        gnengengengen js bad va bene ok
    */

    private size: number;
    private workers: EventQueue<WrappedWorker<Y>>;
    private busy_workers: EventQueue<WrappedWorker<Y>>;
    private path: string;
    private q: number;

    constructor(size: number, worker_path: string){

        super();
        this.path = worker_path;
        this.size = size;
        this.q = 0;
        this.workers = new EventQueue<WrappedWorker<Y>>();
        this.busy_workers = new EventQueue<WrappedWorker<Y>>();
        
        this.init();

    }

    private async init(){

        for(let i = 0; i < this.size; i++){
            const w = new WrappedWorker<Y>(this.path);
            this.workers.push(w);
            w.once('ready', () => { 

                this.q++;
                if(this.q == this.size) return this.setListeners();

            })
        }

    }
    private setListeners(){
        this.on('job', item => this.dispatch(item as Y));
        this.emit('ready');
    }
    async dispatch(item: Y){
       
        const worker = this.workers.shift();
        
        if(worker){
            
            this.busy_workers.push(worker);
            worker.work(item);

            worker.once('done', () => {
                this.busy_workers.pull(worker);
                this.workers.push(worker);
            })
                
        }else{

            await this.wait()
            this.dispatch(item);

        }

    }

    private wait(): Promise<WrappedWorker<Y>>{

        return new Promise(
            (resolve, _) => {

                this.workers.once('push', worker => {
                    
                    resolve(worker);
            
                });

            }
        )

    }

}

interface WorkerEvents{
    'done': () => void;
    'ready': () => void;
}

class WrappedWorker<Y extends PossibleJob> extends TypedEmitter<WorkerEvents>{
    
    private path: string;
    private worker: PossibleWorker | undefined;
    private _id: Symbol;
    private pseudo: string;

    constructor(path: string){

        super();
        this.path = path;
        this.pseudo = randomBytes(2).toString('hex');
        this.worker = undefined;
        this._id = Symbol(this.pseudo);

        this.init()

    }

    private async init(){

        this.worker = await spawn<PossibleWorker>(new Worker(this.path))    
        this.emit('ready');

    }
    get id(){
        return this.pseudo;
    }

    async work(item: Y){
        
        if(!this.worker) return;

        await this.worker!.broadcast(item);
        this.emit('done');

    }

}

interface QueueEvents<T>{
    'push': (item: T) => void;
    'pull': (item: T) => void;
}

class EventQueue<T> extends TypedEmitter<QueueEvents<T>>{

    private queue: Array<T>;

    constructor(){
        super();
        this.queue = new Array<T>();
    }
    pushSilent(item: T){ this.queue.push(item) }
    push(item: T){
        this.queue.push(item);
        this.emit('push', item);
    }
    pull(item: T){
        const idx = this.queue.indexOf(item);
        const i = this.queue[idx];
        this.emit('pull', i);
        this.queue.splice(idx, 1);
    }
    shift(){
        return this.queue.shift();
    }
    get length(){
        return this.queue.length;
    }

}