import express from 'express';
import xss = require('xss-filters');
import AuthController, { JWTPayload } from "../controllers/AuthController";
import UserController from "../controllers/UserController";
import { randomBytes } from "crypto";
import HTTPError from "../HTTPError";
import utils from "../utils"

let router = express.Router();

router.post('/register', utils.requiredParameters("POST", ["username", "email", "password"]), async(req: express.Request, res: express.Response) => {

    let username: string = xss.inHTMLData(req.body.username),
        email: string = xss.inHTMLData(req.body.email),
        password: string = xss.inHTMLData(req.body.password),
        unimore_id: string | undefined = xss.inHTMLData(req.body.unimore_id); // facoltativo

    if(await UserController.isRegistered(email))
        return HTTPError.USER_EXISTS.toResponse(res);



}) // todo long and boring


router.post('/login', utils.requiredParameters("POST", ["email", "password"]), async(req: express.Request, res: express.Response) => {

    let email = xss.inHTMLData(req.body.email),
        password = xss.inHTMLData(req.body.password),
        user;
    
    // TODO: captcha

    user = await AuthController.loginCheck(email, password);
    
    if(user == null)
        return HTTPError.INVALID_CREDENTIALS.toResponse(res);    

    let payload: JWTPayload = {
        userid: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        isAdmin: user.admin
    }

    try{
        
        let auth_token = await AuthController.signJWT(payload);
        let refresh_token = randomBytes(128).toString('hex');
        
        await AuthController.addRefreshToken(refresh_token, user[0].id);

        res.cookie('ref_token', refresh_token, {path: '/', domain: process.env.HOST,  maxAge: parseInt((<string>process.env.REFRESH_TOKEN_TIMEOUT_SECONDS)), httpOnly: true, secure: true});
        res.json({success: true, auth_token, refresh_token_expiry: ((Date.now() / 1000) + parseInt((<string>process.env.REFRESH_TOKEN_TIMEOUT_SECONDS))).toFixed(0)}); 
        
    }catch(err){

        console.log(err); // debug
        
        return HTTPError.GENERIC_ERROR.toResponse(res);

    }

})

export = router;