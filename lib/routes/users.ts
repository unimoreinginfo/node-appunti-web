import express from 'express';
import UserController, { User } from "../controllers/UserController";
import AuthController from "../controllers/AuthController";
import utils from "../utils"
import HTTPError from '../HTTPError';
import bcrypt from "bcryptjs"

let router = express.Router();

router.get('/', AuthController.middleware, AuthController.adminMiddleware, async (req: express.Request, res: express.Response) => {

    let result = await UserController.getUsers(
        parseInt(req.query.page as string || "1")
    )
    
    res.json({
        success: true,
        result
    });
});

router.get('/size', AuthController.middleware, async(req: express.Request, res: express.Response) => {

    let me = JSON.parse(res.get('user')) as User;
    let folder_size = await UserController.getUserSize(me.id);
    let folder_size_kilobytes = (folder_size / 1024).toFixed(2),
        folder_size_megabytes = (folder_size / (1024 * 1024)).toFixed(2),
        folder_size_gigabytes = (folder_size / (1024 * 1024 * 1024)).toFixed(2);

    res.json({
        folder_size_bytes: folder_size,
        folder_size_kilobytes,
        folder_size_megabytes,
        folder_size_gigabytes,
        completion_percentage: (100 * parseFloat(folder_size_megabytes) / parseInt(process.env.MAX_USER!)).toFixed(2),
        max_folder_size_bytes: parseInt(process.env.MAX_USER!) * 1024 * 1024,
        max_folder_size_kilobytes: parseInt(process.env.MAX_USER!) * 1024,
        max_folder_size_megabytes: parseInt(process.env.MAX_USER!),
        max_folder_size_gigabytes: parseInt(process.env.MAX_USER!) / 1024
    });

})

router.get('/:userId', async (req: express.Request, res: express.Response) => {
    let result = await UserController.getUser(req.params.userId);
    if (!result)
        return HTTPError.USER_NOT_FOUND.toResponse(res);
        
    res.json({
        success: true,
        result
    });
});

router.post('/:user_id',
    utils.requiredParameters("POST", [
        "unimore_id",
        "admin",
        "name",
        "surname",
    ]),
    [AuthController.middleware, AuthController.userManagementMiddleware],
    async (req: express.Request, res: express.Response) => {
        let me = JSON.parse(res.get('user'));
        let user_id = req.params.user_id;

        if (!me.admin && req.body.password)
            return new HTTPError("password_overwrite_unauthorized", 401).toResponse(res);

        if (!me.admin && req.body.admin)
            return new HTTPError("admin_upgrade_unauthorized", 401).toResponse(res);

        let unimore_id = parseInt(req.body.unimore_id);
        let admin = parseInt(req.body.admin);

        if(isNaN(unimore_id)) unimore_id = 0;
        if(isNaN(admin)) admin = 0;

        await UserController.updateUser(
            user_id,
            req.body.name,
            req.body.surname,
            req.body.password,
            unimore_id,
            admin
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
            if(!user) return HTTPError.USER_NOT_FOUND.toResponse(res);
            
            let matching = await bcrypt.compare(old_password, user.password!);
            if (!matching) return HTTPError.INVALID_CREDENTIALS.toResponse(res);
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
