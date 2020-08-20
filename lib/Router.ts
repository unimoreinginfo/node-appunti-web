import express from 'express';
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
import HTTPError from './HTTPError'

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
        this.#app.use(fileUpload({createParentPath: true}));

        this.#app.use('/public', express.static('./public'));

        this.#app.use('/', require("./routes/main")); // possiamo fare sta cosa del require perché tanto quando viene chiamato il file è già in .js
        this.#app.use('/subjects', require("./routes/subjects"));
        this.#app.use('/notes', require("./routes/notes"));
        this.#app.use('/auth', require("./routes/auth"));
        this.#app.listen(process.env.PORT);

        this.#app.all('*', (req: express.Request, res: express.Response) => {

            return HTTPError.USER_EXISTS.toResponse(res);
            
        })

        console.log(`listening on ${process.env.PORT}`);
        console.log(`live on ${process.env.URI}`);
    }

}