import express from 'express';
import xss = require('xss-filters');
import AuthController from "../controllers/AuthController";
import UserController from "../controllers/UserController";
import HTTPError from "../HTTPError";

let router = express.Router();

router.post('/register', async(req: express.Request, res: express.Response) => {

    let username: string = xss.inHTMLData(req.body.username),
        email: string = xss.inHTMLData(req.body.email),
        password: string = xss.inHTMLData(req.body.password),
        unimore_id: string | undefined = xss.inHTMLData(req.body.unimore_id);

    if(await UserController.isRegistered(email))
        return HTTPError.USER_EXISTS.toResponse(res);

})

export = router;