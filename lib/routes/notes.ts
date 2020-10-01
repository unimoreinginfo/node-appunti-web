import express from 'express';
import NoteController from "../controllers/NoteController";
import AuthController from "../controllers/AuthController";
import SubjectController from "../controllers/SubjectController";
import { post } from './main';
import utils from '../utils';
import HTTPError from '../HTTPError';
import xss = require("xss-filters");
import UserController from '../controllers/UserController';

let ExpressBrute = require('express-brute');
let store = new ExpressBrute.MemoryStore()

let search_brute = new ExpressBrute(store, {

    freeRetries: 25,
    minWait: 0.5 * 1000, // 0.5 secondi di attesa fra ogni richiesta dopo 25 richieste consecutive
    maxWait: 5 * 60 * 1000, // 5m di attesa mano a mano che si continua a fare richieste oltre la time frame
    refreshTimeoutOnRequest: true,
    failCallback: (req, res, next, valid_date) => {
        return HTTPError.TOO_MANY_REQUESTS.addParam('see_you_at', parseInt((new Date(valid_date).getTime() / 1000).toFixed(0))).toResponse(res)
    }

})

let upload_brute = new ExpressBrute(store, {

    freeRetries: 30,
    minWait: 24 * 60 * 60 * 1000,
    maxWait: 24 * 60 * 60 * 1000,
    lifetime: 24 * 60 * 60,
    refreshTimeoutOnRequest: false,
    attachResetToRequest: false,
    failCallback: (req, res, next, valid_date) => {
        return HTTPError.TOO_MANY_REQUESTS.addParam('see_you_at', parseInt((new Date(valid_date).getTime() / 1000).toFixed(0))).toResponse(res)
    }

})


let router = express.Router();

router.get('/', search_brute.prevent, async (req: express.Request, res: express.Response) => {
    try{

        const subjectId = parseInt(req.query.subject_id as string);
        const authorId = req.query.author_id as string;
        const orderBy = req.query.order_by as string;
        const translateSubjects: boolean = ((req.query.translate_subjects as string) || "").length > 0 ? true : false; 
        const start = parseInt(req.query.page as string || "1");
    
        res.json({
            success: true,
            result: (await NoteController.getNotes(start, subjectId, authorId, orderBy, translateSubjects)).results[1]
        }); // non ho capito perché ritorni un array in un array ok???

    }catch(err){

        console.log(err);
        return HTTPError.GENERIC_ERROR.toResponse(res);

    }
});

router.get('/search', search_brute.prevent, utils.requiredParameters("GETq" /* GETq prende i parametri in req.query al posto che in req.params*/, ["q"]), async(req: express.Request, res: express.Response) => {

    const query = req.query.q as string;

    try{
        let result = await NoteController.search(query);
        let parsed = JSON.parse(result as string);
        if(!parsed)
            return res.json({
                success: true,
                result: []
            });

        res.json({
            success: true,
            result: parsed            
        });

    }catch(err){
        return HTTPError.GENERIC_ERROR.toResponse(res);
    }

})

router.post('/:subject_id/:note_id', AuthController.middleware, utils.requiredParameters("POST", ["title", "new_subject_id"]), async (req: express.Request, res: express.Response) => {

    try{

        let me = JSON.parse(res.get("user"));        
        let note = await (NoteController.getNote(req.params.note_id, parseInt(req.params.subject_id), false));        

        if(!note)
            return HTTPError.NOT_FOUND.toResponse(res);

        if(!me.admin){
            
            if(note.result[0].author_id != me.id)
                return HTTPError.UNAUTHORIZED.toResponse(res);
                
        }

        res.json({
            success: true,
            result: (await NoteController.updateNote(
                xss.inHTMLData(req.params.note_id as string),
                xss.inHTMLData(req.body.title as string),
                parseInt(xss.inHTMLData(req.params.subject_id)),
                parseInt(xss.inHTMLData(req.body.new_subject_id))
            )).results.affectedRows
        });
        
    }catch(err){

        console.log(err);
        return HTTPError.GENERIC_ERROR.toResponse(res);
    
    }

});

router.post('/', upload_brute.prevent, AuthController.middleware, utils.requiredParameters("POST", ["title", "subject_id"]), async (req, res: express.Response) => {

    let file;
    try{

        let me = JSON.parse(res.get('user'));

        if ((req as any).files === undefined || (file = (req as any).files.notes) === undefined)
            return HTTPError.missingParameters("notes").toResponse(res);

        let title = xss.inHTMLData(req.body.title);
        let subject_id = parseInt(xss.inHTMLData(req.body.subject_id));
        let subject = await SubjectController.getSubject(subject_id);
        let size = await UserController.getUserSize(me.id);
        let current_size = 0;

        if(file.length > process.env.MAX_FILES_PER_REQUEST!){

            await utils.deleteTmpFiles(file);
            return HTTPError.TOO_MANY_FILES.addParam('max_files', process.env.MAX_FILES_PER_REQUEST!).toResponse(res);

        }
            
        
        if(file.hasOwnProperty("name"))
            current_size += file.size;
        else{
            file.forEach(f => {

                current_size += f.size;

            })
        }

        if(current_size + size > parseInt(process.env.MAX_USER!) * 1024 * 1024){
            
            await utils.deleteTmpFiles(file);
            return HTTPError.MAX_SIZE_REACHED.toResponse(res);

        }

        await NoteController.addNotes(me.id, title, file, subject_id);
        await UserController.setUserSize(me.id);

        res.json({ success: true });

    }catch(err){

        console.log(err);
        
        return HTTPError.GENERIC_ERROR.toResponse(res);

    }

});

router.get('/:subject_id/:note_id', search_brute.prevent, async (req: express.Request, res: express.Response) => {
    try{
        let r = await NoteController.getNote(
            req.params.note_id as string,
            parseInt(req.params.subject_id),
            ((req.query.translate_subjects as string) || "").length > 0 ? true : false
        );

        if(!r)
            return HTTPError.NOT_FOUND.toResponse(res);      

        res.json({
            success: true,
            result: {
                info: r.result[0],
                files: r.files
            }
        });

    }catch(err){
        console.log(err);
        return HTTPError.GENERIC_ERROR.toResponse(res);
    }
});

router.delete('/:subject_id/:note_id', AuthController.middleware, async (req: express.Request, res: express.Response) => {
    try{
        
        let me = JSON.parse(res.get('user'));
        let note = await NoteController.getNote(req.params.note_id, parseInt(req.params.subject_id), false);

        if(!note)
            return HTTPError.NOT_FOUND.toResponse(res);

        if(!me.admin){
            if(note!.result[0].author_id != me.id)
                return HTTPError.UNAUTHORIZED.toResponse(res);
        }
        
        await NoteController.deleteNote(req.params.note_id, parseInt(req.params.subject_id));
        res.json({
            success: true
        });
    }catch(err){
        console.log(err);
        HTTPError.GENERIC_ERROR.toResponse(res);
    }
});

export = router;
