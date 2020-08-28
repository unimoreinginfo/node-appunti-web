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

        const subjectId = parseInt(req.query.subject_id as string);
        const authorId = parseInt(req.query.author_id as string);
        const orderBy = req.query.order_by as string;
        const translateSubjects: boolean = ((req.query.translate_subjects as string) || "").length > 0 ? true : false; 
        const start = parseInt(req.query.page as string || "1");
    
        res.send((await NoteController.getNotes(start, subjectId, authorId, orderBy, translateSubjects)).results[1]); // non ho capito

    }catch(err){

        console.log(err);
        return HTTPError.GENERIC_ERROR.toResponse(res);

    }
});

router.get('/search', utils.requiredParameters("GETq" /* GETq prende i parametri in req.query al posto che in req.params*/, ["q"]), async(req: express.Request, res: express.Response) => {

    const query = req.query.q! as string;

    console.log(query);

    try{
        let result = await NoteController.search(query);
        let parsed = JSON.parse(result as string);
        if(!parsed)
            return res.json([]);

        res.json(parsed);

    }catch(err){
        return HTTPError.GENERIC_ERROR.toResponse(res);
    }

})

router.post('/:noteId', AuthController.middleware, async (req: express.Request, res: express.Response) => {

    try{

        res.json(await NoteController.updateNote(
            req.params.note_id as string,
            req.body.title as string,
            parseInt(req.body.subject_id),
            parseInt(req.body.old_subject_id)
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

router.get('/:subject_id/:note_id', async (req: express.Request, res: express.Response) => {
    try{
        let r = await NoteController.getNote(
            req.params.note_id as string,
            parseInt(req.params.subject_id),
            ((req.query.translate_subjects as string) || "").length > 0 ? true : false
        );

        if(!r)
            return HTTPError.NOT_FOUND.toResponse(res);

        res.json(r);

    }catch(err){
        console.log(err);
        return HTTPError.GENERIC_ERROR.toResponse(res);
    }
});

router.delete('/:subject_id/:note_id', AuthController.middleware, async (req: express.Request, res: express.Response) => {
    try{
        
        // todo: controllare che chi sta cancellando la nota sia autorizzato
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
