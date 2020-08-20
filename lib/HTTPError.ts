import { Response } from "express";

export default class HTTPError{

    #error_message: string;
    #error_code: number;

    constructor(error_message: string, error_code: number){

        this.#error_message = error_message;
        this.#error_code = error_code;

    }

    // errors
    public static readonly USER_EXISTS: HTTPError = new HTTPError('user_exists', 409);
    public static readonly NOT_FOUND: HTTPError = new HTTPError('not_found', 404);
    public static readonly INVALID_CREDENTIALS = new HTTPError('invalid_credentials', 401);
    public static readonly EXPIRED_CREDENTIALS = new HTTPError('expired_credentials', 401);
    public static readonly GENERIC_ERROR = new HTTPError('generic_error', 500);

    public toResponse(res: Response): Response{

        return res.status(this.#error_code).json({
            success: false,
            error: this.#error_message,
            status: this.#error_code
        })

    }
     
}