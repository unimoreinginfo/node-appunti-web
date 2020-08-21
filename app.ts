'use strict'
import * as dotenv from "dotenv";
import Router from "./lib/Router";

import db from "./lib/db";

dotenv.config();

// init di tutto
if(!process.env.PORT) throw new Error('port undefined'); // mi sembra di usare rust mamma mia...
if(!process.env.URI) throw new Error('uri undefined'); // troverò un modo più carino di fare sta cosa
if(!process.env.REFRESH_TOKEN_TIMEOUT_SECONDS) throw new Error('timeout seconds jwt undefined'); // troverò un modo più carino di fare sta cosa

const router = new Router();
router.init();

db.init();
console.log("MySQL init");
