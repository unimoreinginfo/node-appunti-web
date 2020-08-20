import express from 'express';
import NoteController from "../controllers/NoteController";
import { post } from './main';

let router = express.Router();

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

router.post('/', async (req: express.Request, res: express.Response) => {
    const file = (req as any).files.notes;
    
    res.json(await NoteController.addNote(
        req.body.title as string,
        file,
        parseInt(req.body.subjectId as string)
    ));
});

router.delete('/:noteId', async (req: express.Request, res: express.Response) => {
    res.json(await NoteController.deleteNote(
        parseInt(req.params.noteId)
    ));
});

export = router;
