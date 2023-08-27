import { Router } from "express";

const router = Router();

export default (parent: Router) => {
    parent.use("/signup", router);

    router.get("/test", (req, res) => {
        res.send("Hello, world!");
    });
};
