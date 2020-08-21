import express from 'express';
import UserController from "../controllers/UserController";
import utils from "../utils"

let router = express.Router();

// todo: implementare middleware

router.get('/', async (req: express.Request, res: express.Response) => {
    res.json(await UserController.getUsers());
});

router.get('/:userId', async (req: express.Request, res: express.Response) => {
    res.json(await UserController.getUser(req.params.userId));
});

router.post('/:userId', utils.requiredParameters("POST", ["userId", "name", "surname", "password", "admin", "unimoreId"]), async (req: express.Request, res: express.Response) => {
    res.json(await UserController.updateUser(
        req.params.userId,
        req.body.name,
        req.body.surname,
        req.body.password,
        parseInt(req.body.admin),
        parseInt(req.body.unimoreId)
    )); // todo, rifare questo metodo
});

export = router;
