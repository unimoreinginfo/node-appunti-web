'use strict'
import * as dotenv from "dotenv";
import Router from "./lib/Router";
import CryptoWorkerPool from "./lib/CryptoWorkerPool";

import db from "./lib/db";

dotenv.config();

// init di tutto
if(!process.env.PORT) throw new Error('port undefined'); // mi sembra di usare rust mamma mia...
if(!process.env.URI) throw new Error('uri undefined'); // troverò un modo più carino di fare sta cosa

const router = new Router();
const pool = new CryptoWorkerPool(10);
router.init();

db.init();
console.log("MySQL init");
