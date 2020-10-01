import express from 'express';
import SubjectController from "../controllers/SubjectController";
import HTTPError from "../HTTPError";

let ExpressBrute = require("express-brute");
let store = new ExpressBrute.MemoryStore();

let router = express.Router();

let search_brute = new ExpressBrute(store, {

    freeRetries: 20,
    minWait: 1 * 1000, // 10 secondi di attesa dopo 10 richieste consecutive
    maxWait: 5 * 60 * 1000, // 5m di attesa mano a mano che si continua a fare richieste oltre la time frame
    refreshTimeoutOnRequest: true,
    failCallback: (req, res, next, valid_date) => {
        return HTTPError.TOO_MANY_REQUESTS.addParam('see_you_at', new Date(valid_date).getTime()).toResponse(res)
    }

})


router.get('/', async (req: express.Request, res: express.Response) => {
    const raw: any = await SubjectController.getSubjects();
    res.json({
        success: true,
        result: raw.results
    });
});

export = router;
