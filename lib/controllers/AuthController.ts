import db from "../db";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from 'express'
import HTTPError from "../HTTPError"
import UserController, { User } from "../controllers/UserController"
import jwt, { TokenExpiredError } from "jsonwebtoken";

export interface JWTPayload {
    user_id: string,
    is_admin: number,
}

export interface Session {
    refresh_token: string,
    user_id: string,
    expiry: string
}

const self = {

    truncateSessions: async (): Promise<any> => {
        return await db.query("TRUNCATE sessions");
    },
    isLogged: async(req: Request, res: Response, next: NextFunction) => {      

        if (!req.headers.authorization){
            res.locals.isLogged = false;
            return next();
        }

        let token = req.headers.authorization.split("Bearer ")[1];
        let refresh_token = req.cookies.ref_token;     

        if(!token || !refresh_token){
            res.locals.isLogged = false;
            return next();
        }

        try {
            
            let jwt_payload = await jwt.verify(token, process.env.JWT_KEY, { algorithm: 'HS256' });
            let session = await self.getSession(refresh_token);                        

            if(!session || session.user_id != jwt_payload.user_id){
                res.locals.isLogged = false;
                return next();
            }

            let user = await UserController.getUser(jwt_payload.user_id);
            if(!user){
                res.locals.isLogged = false;
                return next();
            }
            
            res.locals.isLogged = true;

            next();
        } catch (err) {

            res.locals.isLogged = false;
            next();

        }

    },
    getRefreshToken: async(req: Request, res: Response, next: NextFunction) => {

        if (!req.headers.authorization)
            return HTTPError.INVALID_CREDENTIALS.toResponse(res);

        let token = req.headers.authorization.split("Bearer ")[1];

        if(!token)
            return HTTPError.INVALID_CREDENTIALS.toResponse(res);


    },
    adminMiddleware: async(req: Request, res: Response, next: NextFunction) => {

        let me = res.locals.user as User;
        let user = await UserController.getUser(me.id);

        if(!user)
            return HTTPError.USER_NOT_FOUND.toResponse(res);        

        if(!user.admin)
            return HTTPError.UNAUTHORIZED.toResponse(res);

        next();
    
    },

    userManagementMiddleware: async (req: Request, res: Response, next: NextFunction) => {

        let me = res.locals.user as User;
        let user_id = req.params.user_id;

        if (me.id != user_id && !me.admin)
            return HTTPError.USER_INFO_ACCESS_UNAUTHORIZED.toResponse(res);

        let user = await UserController.getUser(user_id);
        
        if (!user)
            return HTTPError.USER_NOT_FOUND.toResponse(res);

        next();
    
    },

    middleware: async (req: Request, res: Response, next: NextFunction) => {

        if (!req.headers.authorization)
            return HTTPError.INVALID_CREDENTIALS.toResponse(res);

        let token = req.headers.authorization.split("Bearer ")[1];
        let refresh_token = req.cookies.ref_token;
        let user;

        if(!token || !refresh_token)
            return HTTPError.INVALID_CREDENTIALS.toResponse(res);

        try {
            
            let jwt_payload = await jwt.verify(token, process.env.JWT_KEY, { algorithm: 'HS256' });
            let session = await self.getSession(refresh_token);            

            if(!session || session.user_id != jwt_payload.user_id)
                return HTTPError.INVALID_CREDENTIALS.toResponse(res);

            let user = await UserController.getUser(jwt_payload.user_id);
            if(!user) return HTTPError.USER_NOT_FOUND.toResponse(res);

            res.locals["user"] = user;

            let user_data = `User data:\n\tid: ${user.id}, name: ${user.name}, surname: ${user.surname}`;

            // logging a caso, devo mettere winston
            console.log(`
            =====================================================================
                Date: ${new Date()}
                ${req.method} ${req.originalUrl}
                ${(res.locals.user != undefined) ? user_data : 'unlogged user requesting'}
                IP: ${req.ip}

            =====================================================================
            `);

            next();
        } catch (err) {
            
            if ((err as any).message === 'jwt malformed') // lol non c'è TokenMalformedException
                return HTTPError.MALFORMED_CREDENTIALS.toResponse(res);

            self.getSession(refresh_token)
                .then(async (session) => {

                    let decoded = await jwt.decode(token, { algorithm: 'HS256' });

                    if(session.user_id != decoded.user_id)
                        return HTTPError.INVALID_CREDENTIALS.toResponse(res);

                    user = await UserController.getUser(session.user_id) as User;
                    if(!user) return HTTPError.USER_NOT_FOUND.toResponse(res);

                    if (!refresh_token || !session || !Object.keys(session).length)
                        return HTTPError.INVALID_CREDENTIALS.toResponse(res);

                    if (session.expiry <= (new Date().getTime() / 1000)) {
                        await self.deleteRefreshToken(refresh_token);
                        return HTTPError.EXPIRED_CREDENTIALS.toResponse(res);
                    }

                    if (err instanceof TokenExpiredError) {
                        
                        let auth_token = await self.signJWT({ user_id: user.id, is_admin: user.admin })
                        
                        console.log("token expired!");

                        return res.status(401).json({
                            success: false,
                            auth_token,
                            status: 401,
                            user
                        })
                        

                    }

                    next();

                })
                .catch(e => {
                        
                    
                        HTTPError.GENERIC_ERROR.toResponse(res)

                    }
                );
        }
    },
    getRefreshTokenFromClient: async(client_token: string) => {

        try{

            let token = (await db.query("SELECT refresh_token FROM sessions WHERE auth_token = ?", [client_token]));
            if(!token.length)
                return null;

            return token[0]["refresh_token"];

        }catch(err){

            return Promise.reject(null);

        }
    
    },
    getSession: async (token: string): Promise<Session | any> => {
        let session = (await db.query("SELECT * FROM sessions WHERE refresh_token = ?", [token]));
        return session.results[0];
    },

    signJWT: async (payload: JWTPayload): Promise<any> => {
        try {
            return await jwt.sign(payload, process.env.JWT_KEY, {
                algorithm: "HS256",
                expiresIn: process.env.JWT_TIMEOUT,
            });
        } catch (err) {
            return Promise.reject(err);
        }
    },

    deleteRefreshToken: async (token: string): Promise<any | Error> => {
        try {
            return await db.query("DELETE FROM sessions WHERE refresh_token = ?", [token]);
        } catch (err) {
            return Promise.reject(err);
        }
    },

    addRefreshToken: async (token: string, auth_token: string, user_id: string): Promise<any | Error> => {

        try {

            let expiry: number = (new Date().getTime() / 1000) + parseInt(process.env.REFRESH_TOKEN_TIMEOUT_SECONDS!);
            await db.query("INSERT INTO sessions VALUES (?, ?, ?, ?)", [token, user_id, expiry, auth_token])

        } catch (err) {
        
            return Promise.reject(err);

        }

    },

    loginCheck: async (email: string, password: string): Promise<any | Error> => {

        try {

            let row: User = await UserController.getUserByEmail(email) as User;

            if (!row)
                return null;

            let hash = row.password!;

            let comparison = await bcrypt.compare(password, hash);

            if (!comparison)
                return null;

            return row;

        } catch (err) {

            return Promise.reject(err);

        }

    }

}

export default self;
