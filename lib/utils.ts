import { randomBytes } from "crypto"
import HTTPError from './HTTPError'
import { unlink } from "fs-extra";
import { Mutex } from 'async-mutex';
import path from 'path'

interface TestableParam{
    name: string,
    re: RegExp
}
let mutex = new Mutex();
function* batch<T>(arr: Array<T>, size: number){

    let a = new Array<T>();
    for(let i = 0; i < arr.length; i++){

        if(i % size == 0 && i > 0){
            yield a;
            a = [];
        }
        a.push(arr[i]);

    }

    yield a; // butta fuori gli elementi rimanenti

}

let self = {

    mutex,
    batch,
    validURL(url: string): boolean{
        
        try{

            const u = new URL(url);            
            if(u.protocol != 'https:') return false;

            return true;

        }catch(err){

            return false;

        }

    },
    deleteTmpFiles: async(files: any): Promise<void> => {
        try{

            let work = [];
            if(files.hasOwnProperty("name"))
                await unlink(path.resolve(files.tempFilePath))
            else{
                let work = new Array();
                files.forEach(f => {

                    work.push(unlink(f.tempFilePath))

                })

                await Promise.all(work)
            }

        }catch(err){

            return Promise.reject(err)

        }

    },

    mimetypes: [
        "text/plain",
        "application/pdf",
        "application/msword", // doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
        "application/vnd.oasis.opendocument.text", // odt
        "image/jpeg",
        "image/png",
        "application/zip",
        "application/x-7z-compressed",
        "application/gzip",
        "application/x-xz",
        "application/x-bzip2",
    ],

    requiredParameters: (type: string = "GET", params: (string | TestableParam)[]) => {

        return function (req, res, next) {

            let bodyType = ((type == "GET") ? req.params : (type == "GETq") ? req.query : req.body);
                
            let missing = new Array();
            let invalid = new Array();

            for (var i = 0; i < params.length; i++) {
                
                if(params[i].hasOwnProperty("name")){

                    let parameter = <TestableParam>params[i];

                    if(!bodyType[parameter.name]){
                        missing.push(parameter.name);
                        continue;
                    }

                    if(!parameter.re.test(bodyType[parameter.name]))
                        invalid.push({
                            name: parameter.name,
                            test: parameter.re.toString()
                        })

                }else{
                    
                    if (!bodyType[<string>params[i]])
                        missing.push(params[i])

                }
            }

            let err = new HTTPError('bad_request', 400);

            if(missing.length > 0)
                err.addParam('missing_parameters', missing);
            
            if(invalid.length > 0)
                err.addParam('invalid_parameters', invalid);

            if(missing.length || invalid.length)
                return err.toResponse(res);

            next();

        }

    },

    generateUserId: () => randomBytes(32).toString('hex'),
    password_regex: /.{8,}$/,
    email_regex: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/

}

export default self;