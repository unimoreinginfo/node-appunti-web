import express from 'express';

let router = express.Router();

router.get('/', (req: express.Request, res: express.Response) => {

    res.json({
        success: true,
        message: 'hello from /webhooks'
    })

})

router.use('/notes', require('./notes'));

export = router;