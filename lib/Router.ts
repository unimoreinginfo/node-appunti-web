import express from 'express';
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const cookiep = require('cookie-parser');
const body = require("body-parser");
const cors = require("cors");
import HTTPError from './HTTPError'
import { rateLimiter } from './redis';

export default class Router{

    #app: express.Application;
    constructor(){
        
        // imo fare una classe per il router ci può aiutare se vogliamo integrare dei microservizi
        // vedremo se sta cosa ha un'utilità oppure no
        this.#app = express();

    }

    init(): void{

        // facciamo un file separato per ogni gruppo di routes
        // così è tutto molto più organizzato
        
        this.#app.use(helmet());
        this.#app.use(cors({
            credentials: true,
            withCredentials: true,
            origin: ['https://beta.appunti.me', 'https://appunti.me'],
            allowedHeaders: ['Authorization', 'authorization', 'Content-type', 'content-type'],
            methods: ['GET', 'POST', 'DELETE', 'PUT']
        }))
        this.#app.use(fileUpload({createParentPath: true, abortOnLimit: '20m', useTempFiles: true, tempFileDir: './tmp'}));
        this.#app.enable("trust proxy");
        this.#app.disable("x-powered-by");
        this.#app.use(cookiep());
        this.#app.use(body.json({ limit: "20mb" }));
        this.#app.use(
            body.urlencoded({ limit: "20mb", extended: true, parameterLimit: 100 }),
        );
        /*this.#app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {

            rateLimiter.consume(req.ip)
                .then(() => next())
                .catch(() => {
                    return HTTPError.TOO_MANY_REQUESTS.toResponse(res);
                })            

        })*/

        this.#app.use('/public', express.static('./public'));

        this.#app.use('/', require("./routes/main")); // possiamo fare sta cosa del require perché tanto quando viene chiamato il file è già in .js
        this.#app.use('/subjects', require("./routes/subjects"));
        this.#app.use('/notes', require("./routes/notes"));
        this.#app.use('/users', require("./routes/users"));
        this.#app.use('/auth', require("./routes/auth"));
        this.#app.use('/webhooks', require("./routes/webhooks"));
        
        this.#app.listen(process.env.PORT);

        this.#app.all('*', (req: express.Request, res: express.Response) => {

            return HTTPError.NOT_FOUND.toResponse(res);
            
        })

        console.log(`listening on ${process.env.PORT}`);
        console.log(`live on ${process.env.URI}`);
    }

}
