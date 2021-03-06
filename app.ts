'use strict'
import * as dotenv from "dotenv";
import Router from "./lib/Router";
import db from "./lib/db";

dotenv.config();

// init di tutto
if(!process.env.PORT) throw new Error('port undefined'); // mi sembra di usare rust mamma mia...
if(!process.env.URI) throw new Error('uri undefined'); // troverò un modo più carino di fare sta cosa
if(!process.env.REFRESH_TOKEN_TIMEOUT_SECONDS) throw new Error('timeout seconds jwt undefined'); 
if(!process.env.AES_KEY) throw new Error('aes key undefined')
if(!process.env.MAX_USER) throw new Error('user limit unspecified')
if(!process.env.MAX_FILES_PER_REQUEST) throw new Error("max files per request limit unspecified");
if(!process.env.NOREPLY) throw new Error("specify email account") 
if(!process.env.NOREPLY_PASSWORD) throw new Error("specify email account password") 

const router = new Router();
router.init();

db.init();