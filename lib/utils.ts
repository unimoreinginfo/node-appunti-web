import { randomBytes } from "crypto"
import HTTPError from './HTTPError'

export default {

    requiredParameters: (type: string = "GET", params: any[]) => {

        return function (req, res, next) {

            const bodyType = ((type == "GET") ? req.params : req.body);
            let missing = new Array();

            for (var i = 0; i < params.length; i++) {

                if (!bodyType[params[i]])
                    missing.push(params[i])

                }

                if (missing.length > 0)
                    return new HTTPError('missing_parameters', 400).addParam("missing", missing).toResponse(res);

            next();

        }
    
    },

    generateUserId: () => randomBytes(32).toString('hex'),

}