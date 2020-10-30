import express from 'express';
import xss = require("xss-filters");
import AuthController, { JWTPayload } from "../controllers/AuthController";
import UserController, { User } from "../controllers/UserController";
import { randomBytes } from "crypto";
import HTTPError from "../HTTPError";
import utils from "../utils"

let router = express.Router();

router.post('/add_unimore_id', AuthController.middleware, utils.requiredParameters("POST", [{
    name: 'unimore_id',
    re: /^\d{6}$/
}]), async(req: express.Request, res: express.Response) => {

    try{

        let me = JSON.parse(res.get('user'));
        await UserController.updateUnimoreId(me.id, req.body.unimore_id);
        await UserController.sendConfirmationEmail(me.id);
        res.json({
            success: true
        })

    }catch(err){

        return HTTPError.GENERIC_ERROR.toResponse(res);

    }

})

router.get('/verify/:token/:user_id', async(req: express.Request, res: express.Response) => {

    let token = req.params.token,
        id = req.params.user_id;

    if(await UserController.verifyConfirmationPair(id, token)){

        await UserController.updateVerificationStatus(id);
        return res.end("Account verificato, puoi tornare su https://appunti.me");

    } else return res.end("Che stai a fa")

})

router.post('/register|signup',
    utils.requiredParameters("POST", ["name", "surname", {
        name: 'email',
        re: utils.email_regex
    }, {
        name: 'password',
        re: utils.password_regex
    }]), async(req: express.Request, res: express.Response) => {

    let name: string = xss.inHTMLData(req.body.name),
        surname: string = xss.inHTMLData(req.body.surname),
        email: string = xss.inHTMLData(req.body.email),
        password: string = xss.inHTMLData(req.body.password),
        unimore_id: number | undefined = req.body.unimore_id; // facoltativo
    
    if(!unimore_id)
        unimore_id = 0;

    try{

        if(await UserController.isRegistered(email))
            return HTTPError.USER_EXISTS.toResponse(res);
        
        let user = await UserController.createUser(name, surname, email, password, 0, unimore_id);
        await UserController.createConfirmationToken(user.id);
        
        if(unimore_id)
            await UserController.sendConfirmationEmail(user.id);

        return res.json({

            success: true

        })

    }catch(err){
        
        return HTTPError.GENERIC_ERROR.toResponse(res);

    }

});

router.post('/login|signin', utils.requiredParameters("POST", ["email", "password"]), async(req: express.Request, res: express.Response) => {

    let email = xss.inHTMLData(req.body.email),
        password = xss.inHTMLData(req.body.password),
        user;
    
    // TODO: captcha

    user = await AuthController.loginCheck(email, password) as User;
    
    if(user == null)
        return HTTPError.INVALID_CREDENTIALS.toResponse(res);    

    let payload: JWTPayload = {
        user_id: user.id,
        is_admin: user.admin,
    };

    try{
        
        let auth_token = await AuthController.signJWT(payload);
        let refresh_token = randomBytes(128).toString('hex');
        
        await AuthController.addRefreshToken(refresh_token, user.id);

        res.cookie('ref_token', refresh_token, {path: '/', domain: process.env.HOST, sameSite: 'none', maxAge: parseInt(process.env.REFRESH_TOKEN_TIMEOUT_MILLISECONDS as string), httpOnly: true, secure: true});
        res.json({success: true, auth_token, refresh_token_expiry: ((Date.now() / 1000) + parseInt((<string>process.env.REFRESH_TOKEN_TIMEOUT_SECONDS))).toFixed(0)}); 
        
    }catch(err){
        
        return HTTPError.GENERIC_ERROR.toResponse(res);

    }

});

router.get('/user', AuthController.middleware, async(req: express.Request, res: express.Response) => {

    let me = JSON.parse(res.get('user'));

    res.json({
        success: true,
        result: me
    })
    
});

export = router;