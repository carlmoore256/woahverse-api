import { Router } from 'express';

const router = Router();

export default (parent : Router) => {

    parent.use("/test", router);

    router.get("/", (req, res) => {
        res.send("Hello, world!");
    });
}