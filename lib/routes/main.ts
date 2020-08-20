import express from 'express';
import AuthController from '../controllers/AuthController';

let router = express.Router();

router.get('/', (req: express.Request, res: express.Response) => {

    res.json({
        success: true,
        message: 'hello'
    })

})

router.get('/test', AuthController.middleware, (req: express.Request, res: express.Response) => {
    res.json({
        success: true,
        message: 'authenticated'
    })
})

export = router;