import express, { Request, Response } from 'express';
import AuthController from '../../controllers/AuthController';
import { User } from '../../controllers/UserController';
import WebHooksController from '../../controllers/WebhooksController';
import HTTPError from '../../HTTPError';
import utils from '../../utils';

let router = express.Router();

router.get('/', (req: express.Request, res: express.Response) => {

    res.json({
        success: true,
        message: 'hello from /webhooks/notes'
    })

});

router.post('/register', 
    utils.requiredParameters("POST", [
        "webhook_title",
        "webhook_url"
    ]),
    AuthController.middleware, 
    async(req: Request, res: Response) => {

        const webhook_title = req.body.webhook_title.toString().trim(),
            webhook_url = req.body.webhook_url.toString().trim();
        
        if(!utils.validURL(webhook_url)) return new HTTPError('invalid_url', 400).toResponse(res);

        try{

            const user = res.locals.user;
            
            const response = await WebHooksController.notes.create(webhook_title, webhook_url, user);
            return res.json({
                success: true,
                credentials: response
            })

        }catch(err){

            console.log(err);
            
            return HTTPError.GENERIC_ERROR.toResponse(res);

        }

})

export = router;