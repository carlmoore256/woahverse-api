import { Router } from 'express';
import DB from '../../../../database/SQLDatabase';

const router = Router();

export default (parent : Router) => {

    parent.use("/MYROUTE", router);

}