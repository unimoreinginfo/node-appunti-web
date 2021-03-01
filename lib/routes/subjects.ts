import express from 'express';
import SubjectController from "../controllers/SubjectController";
import HTTPError from '../HTTPError';

let router = express.Router();

router.get('/:id', async(req: express.Request, res: express.Response) => {

    try{

        const subject = await SubjectController.getSubject(parseInt(req.params.id as string));
        
        return res.json({
            success: true,
            result: subject
        })

    }catch(err){
        
        return HTTPError.GENERIC_ERROR.toResponse(res);

    }

})

router.get('/', async (req: express.Request, res: express.Response) => {
    try{
    
        const raw: any = await SubjectController.getSubjects();
        res.json({
            success: true,
            result: raw.results
        });

    }catch(err){

        return HTTPError.GENERIC_ERROR.toResponse(res);
    
    }
});

export = router;
