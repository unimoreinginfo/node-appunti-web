import express from 'express';
const helmet = require('helmet');

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
        
        this.#app.use(helmet())
        this.#app.use('/', require("./routes/main")); // possiamo fare sta cosa del require perché tanto quando viene chiamato il file è già in .js
        this.#app.listen(process.env.PORT);

        console.log(`listening on ${process.env.PORT}`);
        console.log(`live on ${process.env.URI}`);
        
        

    }

}