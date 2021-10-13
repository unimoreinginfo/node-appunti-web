import express, { Router } from 'express';
import NoteController from "../controllers/NoteController";
import AuthController from "../controllers/AuthController";
import SubjectController from "../controllers/SubjectController";
import utils from '../utils';
import HTTPError from '../HTTPError';
import xss = require("xss-filters");
import UserController from '../controllers/UserController';
import { debufferize } from '../db'
import { unlink } from 'fs-extra'
import path from 'path'
import { User } from '../controllers/UserController';
import workers from '../workers';

let router = express.Router();

router.get('/', AuthController.isLogged, async (req: express.Request, res: express.Response) => {
    try{

        console.log(res.locals.isLogged);

        const subjectId = parseInt(req.query.subject_id as string);
        const authorId = req.query.author_id as string;
        const orderBy = req.query.order_by as string;
        const translateSubjects: boolean = ((req.query.translate_subjects as string) || "").length > 0 ? true : false; 
        const start = parseInt(req.query.page as string || "1");
        let query = await NoteController.getNotes(start, subjectId, authorId, orderBy, translateSubjects, res.locals.isLogged);
        let result = debufferize(query.result);

        res.json({
            success: true,
            pages: query.pages,
            result
        })
    

    }catch(err){

        console.log(err);
        
        return HTTPError.GENERIC_ERROR.toResponse(res);

    }
});

router.get('/search', utils.requiredParameters("GETq" /* GETq prende i parametri in req.query al posto che in req.params*/, ["q"]), async(req: express.Request, res: express.Response) => {

    const query = req.query.q as string;
    let page = parseInt(req.query.page as string),
        subject_id = parseInt((req.query.subject_id as string == 'any') ? '' : req.query.subject_id as string),
        author_id = req.query.author_id as string;

    if(isNaN(page) || page <= 0)
        page = 1;

    try{

        let r = await NoteController.search(query, page, subject_id, author_id);
        
        if(!r)
            return res.json({
                success: true,
                pages: 0,
                result: []
            });

        res.json({
            success: true,
            pages: r.pages,
            result: r.result       
        });

    }catch(err){

        console.log(err);
        
        return HTTPError.GENERIC_ERROR.toResponse(res);

    }

})

router.post('/:subject_id/:note_id', AuthController.middleware, utils.requiredParameters("POST", ["title", "new_subject_id"]), async (req: express.Request, res: express.Response) => {

    try{

        let me = res.locals.user as User;        
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

router.post('/', AuthController.middleware, utils.requiredParameters("POST", ["title", "subject_id"]), async (req, res: express.Response) => {

    try{

        let me = res.locals.user as User;

        if(!(await UserController.isUserVerified(me.id)))
            return new HTTPError('user_not_verified', 403).toResponse(res);

        if (!(req as any).files.notes)
            return HTTPError.missingParameters("notes").toResponse(res);
    
        let title = xss.inHTMLData(req.body.title);
        let subject_id = parseInt(xss.inHTMLData(req.body.subject_id));
        let subject = await SubjectController.getSubject(subject_id);
        let size = await UserController.getUserSize(me.id);
        let current_size = 0;
        let delete_queue = new Array(), ok_queue = new Array(); 
        let files = (req as any).files.notes;    

        if(files.hasOwnProperty("name")){
            if(!utils.mimetypes.includes(files.mimetype)){
                await utils.deleteTmpFiles(files);
                return HTTPError.INVALID_MIMETYPE.toResponse(res);
            }
            ok_queue.push(files);
            current_size += files.size;
        }
        else{

            if(files.length > process.env.MAX_FILES_PER_REQUEST!){

                await utils.deleteTmpFiles(files);
                return HTTPError.TOO_MANY_FILES.addParam('max_files', process.env.MAX_FILES_PER_REQUEST!).toResponse(res);

            }

            files.forEach(f => {
                
                if(!utils.mimetypes.includes(f.mimetype)){
                    delete_queue.push(unlink(path.resolve(f.tempFilePath)))
                }
                else{
                    ok_queue.push(f);
                    current_size += f.size;
                }

            })
        }

        if(current_size + size > parseInt(process.env.MAX_USER!) * 1024 * 1024){
            
            await utils.deleteTmpFiles(files);
            return HTTPError.MAX_SIZE_REACHED.toResponse(res);

        }

        if(!ok_queue.length){
            return HTTPError.INVALID_MIMETYPE.toResponse(res);
        }
        
        await Promise.all(delete_queue);
        let note = await NoteController.addNotes(me.id, title, ok_queue, subject_id);
        await UserController.setUserSize(me.id);
        workers.notes.queue(w => w.broadcastNote(note));

        res.json({ success: true, written_files: note.written_files, url: note.storage_url });

    }catch(err){
        
        console.log(err);
        
        return HTTPError.GENERIC_ERROR.toResponse(res);

    }

});

router.get('/:subject_id/:note_id', async (req: express.Request, res: express.Response) => {
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

        return HTTPError.GENERIC_ERROR.toResponse(res);
    }
});

router.delete('/:subject_id/:note_id', AuthController.middleware, async (req: express.Request, res: express.Response) => {
    try{
        
        let me = res.locals.user as User;
        let note = await NoteController.getNote(req.params.note_id, parseInt(req.params.subject_id), false);

        if(!note)
            return HTTPError.NOT_FOUND.toResponse(res);

        if(!me.admin){
            if(note!.result[0].author_id != me.id)
                return HTTPError.UNAUTHORIZED.toResponse(res);
        }
        
        await NoteController.deleteNote(req.params.note_id, me.id, parseInt(req.params.subject_id));
        await UserController.setUserSize(me.id);
        res.json({
            success: true
        });
    }catch(err){
        HTTPError.GENERIC_ERROR.toResponse(res);
    }
});

export = router;
