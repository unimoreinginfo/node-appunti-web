import express from 'express';
import SubjectController from "../controllers/SubjectController";

let router = express.Router();

router.get('/subjects', async (req: express.Request, res: express.Response) => {
    const raw: any = await SubjectController.getSubjects();
    res.json(raw.results);
});

export = router;
