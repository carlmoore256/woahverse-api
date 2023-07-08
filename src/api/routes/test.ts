import { Router } from 'express';
import DB from '../../../../database/SQLDatabase';

const router = Router();

export default (parent : Router) => {

    parent.use("/test", router);

    router.get("/", (req, res) => {
        res.send("Hello, world!");
    });
}