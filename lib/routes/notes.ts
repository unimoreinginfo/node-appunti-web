import express from 'express';
import NoteController from "../controllers/NoteController";
import AuthController from "../controllers/AuthController";
import SubjectController from "../controllers/SubjectController";
import { post } from './main';
import utils from '../utils';
import HTTPError from '../HTTPError';

let router = express.Router();

router.use(AuthController.middleware);

router.get('/', async (req: express.Request, res: express.Response) => {
    const subjectId = parseInt(req.query.subjectId as string);
    const authorId = parseInt(req.query.authorId as string);
    const orderBy = req.query.orderBy as string;

    res.send((await NoteController.getNotes(subjectId, authorId, orderBy)).results);
});

router.get('/:noteId', async (req: express.Request, res: express.Response) => {
    res.json(await NoteController.getNote(
        parseInt(req.params.noteId)
    ));
});

router.post('/:noteId', async (req: express.Request, res: express.Response) => {
    res.json(await NoteController.updateNote(
        parseInt(req.params.noteId),
        req.body.title,
        req.body.subjectId
    ));
});

router.post('/', utils.requiredParameters("POST", ["title", "subject_id"]), async (req, res: express.Response) => {
    let me = JSON.parse(res.get('user'));

    let file;
    if ((req as any).files === undefined || (file = (req as any).files.notes) === undefined)
        return HTTPError.missingParameters("notes").toResponse(res);

    let title = req.body.title;
    let subject_id = parseInt(req.body.subject_id);
    let subject = await SubjectController.getSubject(subject_id);

    await NoteController.addNote(me.id, title, file, subject_id);
    console.log(`${me.name} ${me.surname} uploaded "${title}" (${subject.name}) ~${file.size}`);

    res.json({ success: true });
});

router.delete('/:noteId', async (req: express.Request, res: express.Response) => {
    res.json(await NoteController.deleteNote(
        parseInt(req.params.noteId)
    ));
});

export = router;
