import express from 'express';
import SubjectController from "../controllers/SubjectController";
import HTTPError from '../HTTPError';

let router = express.Router();

router.get('/:id', async(req: express.Request, res: express.Response) => {

    let id = parseInt(req.params.id as string);
    if(isNaN(id))
        return HTTPError.NOT_FOUND.toResponse(res);

    try{

        const subject = await SubjectController.getSubject(id);
        
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
