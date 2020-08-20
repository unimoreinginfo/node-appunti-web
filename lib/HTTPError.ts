import { Response } from "express";

export default class HTTPError{

    #error_message: string;
    #error_code: number;

    constructor(error_message: string, error_code: number){

        this.#error_message = error_message;
        this.#error_code = error_code;

    }

    public static readonly USER_EXISTS: HTTPError = new HTTPError('user_exists', 409);

    public toResponse(res: Response): Response{

        return res.status(this.#error_code).json({
            success: false,
            error: this.#error_message,
            status: this.#error_code
        })

    }
     
}