import { Router } from 'express';

const router = Router();

export default (parent : Router) => {

    parent.use("/MYROUTE", router);

}