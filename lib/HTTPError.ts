import { Response } from "express";

export default class HTTPError{

    #error_message: string;
    #error_code: number;
    #response: {
        success: boolean,
        [value: string]: any
    }

    constructor(error_message: string, error_code: number){

        this.#error_message = error_message;
        this.#error_code = error_code;
        this.#response = {
            success: false,
            error: this.#error_message,
            status: this.#error_code
        };

    }

    // errors
    public static readonly USER_EXISTS: HTTPError = new HTTPError('user_exists', 409);
    public static readonly NOT_FOUND: HTTPError = new HTTPError('not_found', 404);
    public static readonly INVALID_CREDENTIALS = new HTTPError('invalid_credentials', 401);
    public static readonly EXPIRED_CREDENTIALS = new HTTPError('expired_credentials', 401);
    public static readonly MALFORMED_CREDENTIALS = new HTTPError('malformed_credentials', 400);
    public static readonly GENERIC_ERROR = new HTTPError('generic_error', 500);
    public static readonly USER_NOT_FOUND = new HTTPError('user_not_found', 404);
    public static readonly UNAUTHORIZED = new HTTPError('unauthorized', 401);
    public static readonly USER_INFO_ACCESS_UNAUTHORIZED = new HTTPError('user_info_access_unauthorized', 401);
    public static readonly MAX_SIZE_REACHED = new HTTPError('max_storage_size_reached', 400);
    public static readonly TOO_MANY_FILES = new HTTPError('too_many_files', 413);
    public static readonly TOO_MANY_REQUESTS = new HTTPError('too_many_requests', 429);
    public static readonly INVALID_MIMETYPE = new HTTPError('invalid_mimetype', 400);
    public static readonly BAD_REQUEST = new HTTPError('bad_request', 400);

    public static readonly missingParameters = (...params: string[]) =>
        new HTTPError('missing_parameters', 400).addParam('missing', params);

    public toResponse(res: Response): Response{

        return res.status(this.#error_code).json(this.#response)

    }

    public addParam(key: string, value: any): this{

        this.#response[key] = value;
        return this;
    
    }

    public addParams(params: {
        [param_name: string]: any
    }[]): this{
        
        Object.keys(params)
            .forEach(key => {

                this.#response[key] = params[key];

            })
        return this;

    }
     
}