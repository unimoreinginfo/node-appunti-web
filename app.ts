'use strict'
import * as dotenv from "dotenv";
import Router from "./lib/Router";
import db from "./lib/db";
import { createDummyUser, populateWebhooks } from './dev-utils';
import { WorkerPool } from "./lib/WorkerPool";
import { NoteWorker } from "./workers/webhooks/notes/broadcast";

dotenv.config();
db.init();

// init di tutto
if(!process.env.PORT) throw new Error('port undefined');
if(!process.env.URI) throw new Error('uri undefined');
if(!process.env.REFRESH_TOKEN_TIMEOUT_SECONDS) throw new Error('timeout seconds jwt undefined'); 
if(!process.env.AES_KEY) throw new Error('aes key undefined');
if(!process.env.MAX_USER) throw new Error('user limit unspecified');
if(!process.env.MAX_FILES_PER_REQUEST) throw new Error("max files per request limit unspecified");
if(!process.env.NOREPLY) throw new Error("specify email account");
if(!process.env.NOREPLY_PASSWORD) throw new Error("specify email account password");

(async() => {

    if(process.env.NODE_ENV === 'dev'){
        process.env.DOMAIN = `localhost:${process.env.PORT}`;
        process.env.URI = `http://localhost:${process.env.PORT}`
        // await createDummyUser();
        // await populateWebhooks();
    }

    console.log(process.env.NODE_ENV);
    
    const router = new Router();
    router.init();

})()

