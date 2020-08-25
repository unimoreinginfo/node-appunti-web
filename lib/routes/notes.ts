import express from 'express';
import NoteController from "../controllers/NoteController";
import AuthController from "../controllers/AuthController";
import SubjectController from "../controllers/SubjectController";
import { post } from './main';
import utils from '../utils';
import HTTPError from '../HTTPError';

let router = express.Router();

router.get('/', async (req: express.Request, res: express.Response) => {
    try{

        const subjectId = parseInt(req.query.subjectId as string);
        const authorId = parseInt(req.query.authorId as string);
        const orderBy = req.query.orderBy as string;
        const translateSubjects: boolean = ((req.query.translateSubjects as string) || "").length > 0 ? true : false;    
    
        res.send((await NoteController.getNotes(subjectId, authorId, orderBy, translateSubjects)).results);

    }catch(err){

        console.log(err);
        return HTTPError.GENERIC_ERROR.toResponse(res);

    }
});

router.get('/:noteId', async (req: express.Request, res: express.Response) => {
    try{
        let r = await NoteController.getNote(
            req.params.noteId as string,
            ((req.query.translateSubject as string) || "").length > 0 ? true : false
        );

        if(!r)
            return HTTPError.NOT_FOUND.toResponse(res);

        res.json(r);

    }catch(err){
        console.log(err);
        return HTTPError.GENERIC_ERROR.toResponse(res);
    }
});

router.post('/:noteId', AuthController.middleware, async (req: express.Request, res: express.Response) => {

    try{

        res.json(await NoteController.updateNote(
            parseInt(req.params.noteId),
            req.body.title,
            req.body.subjectId
        ));
        
    }catch(err){

        console.log(err);
        return HTTPError.GENERIC_ERROR.toResponse(res);
    
    }

    
});

router.post('/', AuthController.middleware, utils.requiredParameters("POST", ["title", "subject_id"]), async (req, res: express.Response) => {

    try{

        let me = JSON.parse(res.get('user'));

        let file;
        if ((req as any).files === undefined || (file = (req as any).files.notes) === undefined)
            return HTTPError.missingParameters("notes").toResponse(res);

        let title = req.body.title;
        let subject_id = parseInt(req.body.subject_id);
        let subject = await SubjectController.getSubject(subject_id);

        console.log(file);
        

        await NoteController.addNotes(me.id, title, file, subject_id);
        console.log(`${me.name} ${me.surname} uploaded "${title}" (${subject.name}) ~ ${file.size}`);

        res.json({ success: true });

    }catch(err){

        console.log(err);
        
        return HTTPError.GENERIC_ERROR.toResponse(res);

    }

});

router.delete('/:noteId', AuthController.middleware, async (req: express.Request, res: express.Response) => {
    try{
        
        // todo: controllare che chi sta cancellando la nota sia autorizzato
        await NoteController.deleteNote(req.params.noteId);
        res.json({
            success: true
        });
    }catch(err){
        console.log(err);
        HTTPError.GENERIC_ERROR.toResponse(res);
    }
});

export = router;
