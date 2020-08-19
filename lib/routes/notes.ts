import express from 'express';
import NoteController from "../controllers/NoteController";

let router = express.Router();

router.get('/', async (req: express.Request, res: express.Response) => {
    const subjectId = parseInt(req.query.subjectId as string);
    const authorId = parseInt(req.query.authorId as string);
    const orderBy = req.query.orderBy as string;

    res.send((await NoteController.getNotes(subjectId, authorId, orderBy)).results);
});

router.post('/', async (req: express.Request, res: express.Response) => {
    const file = (req as any).files.notes;

    // TODO: If the file is zipped, unzip it and add the list of notes files contained.

    res.json(await NoteController.addNote(
        req.body.title as string,
        file,
        parseInt(req.body.subjectId as string)
    ));
});

export = router;
