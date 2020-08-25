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

    middleware: async (req: Request, res: Response, next: NextFunction) => {
        if (!req.headers.authorization)
            return HTTPError.INVALID_CREDENTIALS.toResponse(res);

        let token = req.headers.authorization.split("Bearer ")[1];

        try {
            let jwt_payload = await jwt.verify(token, process.env.JWT_KEY, { algorithm: 'HS256' });
            let user = await UserController.getUser(jwt_payload.user_id);

            //console.log("jwt_payload", jwt_payload);
            //console.log("user", user);

            res.set('user', JSON.stringify(user));

            next();
        } catch (err) {
            if (err.message === 'jwt malformed') // lol non c'è TokenMalformedException
                return HTTPError.MALFORMED_CREDENTIALS.toResponse(res);

            let refresh_token = req.cookies.ref_token;
            self.getSession(refresh_token)
                .then(async (session) => {
                    if (!refresh_token || !session || !Object.keys(session).length)
                        return HTTPError.INVALID_CREDENTIALS.toResponse(res);

                    if (session.expiry <= (new Date().getTime() / 1000)) {
                        await self.deleteRefreshToken(refresh_token);
                        return HTTPError.EXPIRED_CREDENTIALS.toResponse(res);
                    }

                    if (err instanceof TokenExpiredError) {
                        console.log("refreshing auth token for %s", session.user_id);

                        let user: User = await UserController.getUser(session.user_id) as User;
                        let auth_token = await self.signJWT({ user_id: user.id, is_admin: user.admin })

                        console.log(`new auth_token: ${auth_token}`);

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
            console.log(err);
            return Promise.reject(err);
        }
    },

    addRefreshToken: async (token: string, user_id: string): Promise<any | Error> => {

        try {

            console.log(user_id);
            let expiry: number = (new Date().getTime() / 1000) + parseInt(process.env.REFRESH_TOKEN_TIMEOUT_SECONDS!);
            await db.query("INSERT INTO sessions VALUES (?, ?, ?)", [token, user_id, expiry])

        } catch (err) {

            console.log(err);
            return Promise.reject(err);

        }

    },

    loginCheck: async (email: string, password: string): Promise<any | Error> => {

        try {

            let row: User = await UserController.getUserByEmail(email) as User;

            if (!row)
                return null;

            let hash = row.password!;
            console.log(row.id);

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