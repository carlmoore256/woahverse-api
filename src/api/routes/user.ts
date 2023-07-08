import { Router } from 'express';
import { trySignToken } from '../authentication/validateUser';

const router = Router();

export default (parent : Router) => {

    parent.use("/user", router);

    router.post("/login", async (req, res) => {
        trySignToken(req.body.username, req.body.password).then((token) => {
            res.json({ token });
        }).catch(() => {
            res.status(401).send("Invalid username or password");
        });
    });
}