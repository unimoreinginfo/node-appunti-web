import db from "../db";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from 'express'
import HTTPError from "../HTTPError"
import UserController from "../controllers/UserController"
import jwt from "jsonwebtoken";

export interface JWTPayload{
    userid: string, 
    name: string,
    surname: string,
    email: string,
    isAdmin: number
}

const self = {

    registerUser: async(username: string, password: string, email: string, unimore_id: string) => {

        // todo

    },

    middleware: async(req: Request, res: Response, next: NextFunction) => {

        console.log(req.headers.authorization);

        if(!req.headers.authorization)
            return HTTPError.INVALID_CREDENTIALS.toResponse(res);

        let token = req.headers.authorization.split("Bearer ")[1];
        try{

            let user = await jwt.verify(token, process.env.JWT_KEY, { algorithm: 'HS256' })
            res.set('user', JSON.stringify(user));

        }catch(err){

            console.log("invalid or expired");
            
            // invalid or expired auth token
            let refresh_token = req.cookies.ref_token;   
            let session = await self.getSession(refresh_token);

            if(!session.results.length)
                return HTTPError.INVALID_CREDENTIALS.toResponse(res);
            
            if(session.results[0].expiry <= (new Date().getTime() / 1000)){
                await self.deleteRefreshToken(refresh_token);
                return HTTPError.EXPIRED_CREDENTIALS.toResponse(res);
            }else{

                // auth token is expired, but refresh token is still good

                console.log("refreshing auth token for %s", session.results[0].user_id);

                let user = await UserController.getUser(session.results[0].user_id);
                let auth_token = await self.signJWT({
                    userid: session.results[0].user_id,
                    name: user.results[0].name,
                    surname: user.results[0].surname,
                    email: user.results[0].email,
                    isAdmin: user.results[0].admin
                })

                res.header('Authorization', `Bearer ${auth_token}`);
                res.set('user', JSON.stringify(await jwt.verify(auth_token, process.env.JWT_KEY, { algorithm: 'HS256' })));

                next();

            }

        }

    },

    getSession: async(token: string): Promise<any | Error> => {

        try{

            return await db.query("SELECT * FROM sessions WHERE refresh_token = ?", [token]);

        }catch(err){

            console.log(err);
            
            return Promise.reject(err);

        }

    },

    signJWT: async(payload: JWTPayload): Promise<any> => {

        try{

            return await jwt.sign(payload, process.env.JWT_KEY, {
                algorithm: "HS256",
                expiresIn: process.env.JWT_TIMEOUT,
            });
            
        }catch(err){

            return Promise.reject(err);

        }

    },

    deleteRefreshToken: async(token: string): Promise<any | Error>  => {

        try{

            return await db.query("DELETE FROM sessions WHERE refresh_token = ?", [token]);

        }catch(err){

            console.log(err);
            
            return Promise.reject(err);

        }

    },

    addRefreshToken: async(token: string, user_id: string): Promise<any | Error> => {

        try{

            console.log(user_id);
            let expiry: number = (new Date().getTime() / 1000) + (30 * 24 * 60 * 60); // 1 mese di refresh token
            await db.query("INSERT INTO sessions VALUES (?, ?, ?)", [token, user_id, expiry])

        }catch(err){

            console.log(err);
            return Promise.reject(err);
        
        }

    },

    loginCheck: async(email: string, password: string): Promise<any | Error> => {

        try{

            let row = await db.query("SELECT * FROM users WHERE email = ?", [email])

            if(row.results.length == 0)
                return null;
            
            let hash = row.results[0].password;
            let comparison = await bcrypt.compare(password, hash);

            if(!comparison)
                return null;
            
            return row.results;

        }catch(err){

            return Promise.reject(err);

        }

    }

}

export default self;