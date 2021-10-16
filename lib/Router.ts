import express from 'express';
import { Worker, spawn, Pool } from 'threads';
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const cookiep = require('cookie-parser');
const body = require("body-parser");
const cors = require("cors");
import HTTPError from './HTTPError'
import db from './db'
import { NoteWorker } from '../workers/webhooks/notes/broadcast';
import { WorkerPool } from './WorkerPool';

export default class Router{

    #app: express.Application;
    #worker_pools: WorkerPool<any>[];

    constructor(...wp: WorkerPool<any>[]){
    
        this.#app = express();
        this.#worker_pools = wp;        

    }

    init(): void{
        
        let origin = ['https://beta.appunti.me', 'https://appunti.me'];
        if(process.env.NODE_ENV != 'production')
            origin.push('https://localhost:3000')

        this.#app.use(helmet());
        this.#app.use(cors({
            credentials: true,
            withCredentials: true,
            origin,
            allowedHeaders: ['Authorization', 'authorization', 'Content-type', 'content-type'],
            methods: ['GET', 'POST', 'DELETE', 'PUT']
        }));
        this.#app.use(fileUpload({createParentPath: true, abortOnLimit: '20m', useTempFiles: true, tempFileDir: './tmp'}));
        this.#app.enable("trust proxy");
        this.#app.disable("x-powered-by");
        this.#app.use(cookiep());
        this.#app.use(body.json({ limit: "20mb" }));
        this.#app.use(
            body.urlencoded({ limit: "20mb", extended: true, parameterLimit: 100 }),
        );

        this.#app.use('/public', express.static('./public'));

        this.#app.use('/', require("./routes/main"));
        this.#app.use('/subjects', require("./routes/subjects"));
        this.#app.use('/notes', require("./routes/notes"));
        this.#app.use('/users', require("./routes/users"));
        this.#app.use('/auth', require("./routes/auth"));
        this.#app.use('/webhooks', require("./routes/webhooks"));
        this.#app.locals["worker_pools"] = this.#worker_pools;
        
        this.#app.listen(process.env.PORT);

        this.#app.all('*', (req: express.Request, res: express.Response) => {

            return HTTPError.NOT_FOUND.toResponse(res);
            
        })

        console.log(`listening on ${process.env.PORT}`);
        console.log(`live on ${process.env.URI}`);
    }

}
