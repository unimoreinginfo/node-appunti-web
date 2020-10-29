import db from "../db";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from 'express'
import HTTPError from "../HTTPError"
import UserController, { User } from "../controllers/UserController"
import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import utils from '../utils';

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

    adminMiddleware: async(req: Request, res: Response, next: NextFunction) => {

        let me = JSON.parse(res.get('user'));
        let user = await UserController.getUser(me.id);

        if(!user)
            return HTTPError.USER_NOT_FOUND.toResponse(res);        

        if(!user.admin)
            return HTTPError.UNAUTHORIZED.toResponse(res);

        next();
    
    },

    userManagementMiddleware: async (req: Request, res: Response, next: NextFunction) => {

        let me = JSON.parse(res.get('user'));
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

        try {

            let jwt_payload = await jwt.verify(token, process.env.JWT_KEY, { algorithm: 'HS256' });
            let session = await self.getSession(refresh_token);

            if(session.user_id != jwt_payload.user_id)
                return HTTPError.INVALID_CREDENTIALS.toResponse(res);

            let user = await UserController.getUser(jwt_payload.user_id);
            if(!user) return HTTPError.USER_NOT_FOUND.toResponse(res);

            res.set('user', JSON.stringify(user));

            next();
        } catch (err) {

            if (err.message === 'jwt malformed') // lol non c'è TokenMalformedException
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
                        
                        res.header('Authorization', `Bearer ${auth_token}`);
                        res.set('user', JSON.stringify(user));
                    }

                    next();

                })
                .catch(e =>
                    HTTPError.GENERIC_ERROR.toResponse(res)
                );
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

    addRefreshToken: async (token: string, user_id: string): Promise<any | Error> => {

        try {

            let expiry: number = (new Date().getTime() / 1000) + parseInt(process.env.REFRESH_TOKEN_TIMEOUT_SECONDS!);
            await db.query("INSERT INTO sessions VALUES (?, ?, ?)", [token, user_id, expiry])

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
