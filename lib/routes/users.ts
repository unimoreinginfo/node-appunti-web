import express from 'express';
import UserController from "../controllers/UserController";
import AuthController from "../controllers/AuthController";
import utils from "../utils"
import HTTPError from '../HTTPError';
import bcrypt from "bcryptjs"

let router = express.Router();

router.get('/', async (req: express.Request, res: express.Response) => {

    let result = await UserController.getUsers(
        parseInt(req.query.page as string || "1")
    )

    console.log(result);
    
    res.json({
        success: true,
        result
    });
});

router.get('/:userId', async (req: express.Request, res: express.Response) => {
    let result = await UserController.getUser(req.params.userId);
    if (result === undefined)
        return HTTPError.USER_NOT_FOUND.toResponse(res);
        
    res.json({
        success: true,
        result
    });
});

router.post('/:user_id',
    [AuthController.middleware, AuthController.userManagementMiddleware],
    async (req: express.Request, res: express.Response) => {
        let me = JSON.parse(res.get('user'));
        let user_id = req.params.user_id;

        if (!me.admin && req.body.password)
            return new HTTPError("password_overwrite_unauthorized", 401).toResponse(res);

        if (!me.admin && req.body.admin)
            return new HTTPError("admin_upgrade_unauthorized", 401).toResponse(res);

        await UserController.updateUser(
            user_id,
            req.body.name,
            req.body.surname,
            req.body.password,
            parseInt(req.body.unimore_id) || undefined,
            parseInt(req.body.admin) || undefined
        );

        res.json({ success: true });
    });

router.post('/:user_id/password',
    [AuthController.middleware, utils.requiredParameters("POST", ["new_password"]), AuthController.userManagementMiddleware],
    async (req: express.Request, res: express.Response) => {
        let me = JSON.parse(res.get('user'));
        let user_id = req.params.user_id;

        if (!me.admin) {
            // The old_password is checked only if the user isn't admin.
            let old_password = req.body.old_password;
            if (!old_password)
                return HTTPError.missingParameters("old_password").toResponse(res);

            let user = await UserController.getUser(user_id);
            let matching = await bcrypt.compare(old_password, user.password!);
            if (!matching)
                return HTTPError.INVALID_CREDENTIALS.toResponse(res);
        }

        let new_password = req.body.new_password;
        await UserController.updateUserPassword(user_id, new_password);

        return res.json({ success: true });
    });

router.delete('/:user_id', [AuthController.middleware], async (req: express.Request, res: express.Response) => {
    let me = JSON.parse(res.get('user'));
    if (!me.admin) 
        return HTTPError.UNAUTHORIZED.toResponse(res);

    let success = await UserController.deleteUser(req.params.user_id);
    if (!success)
        return HTTPError.USER_NOT_FOUND.toResponse(res);

    res.json({ success });
});

export = router;
