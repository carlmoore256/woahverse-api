import { Router } from 'express';
import { IUser } from '../../../../database/types';
import DB from '../../../../database/SQLDatabase';
import bcrypt from 'bcrypt';

const router = Router();

export default (parent : Router) => {

    parent.use("/admin", router);
    

    router.get("/list-users", (req, res) => {
        // get all devices from the database
        DB.getAllUsers().then((users) => {
            res.send(users);
        });
    });

    router.post("/add-user", async (req, res) => {
        const user = req.body as IUser;

        // Generate a salt
        const salt = bcrypt.genSaltSync(10);

        // Hash the password with the salt
        user.password = bcrypt.hashSync(user.password, salt);

        const success = await DB.insertUser(user);
        if (success) {
            res.send("User added");
        } else {
            res.status(500);
            res.send("Error adding user");
        }
    })
}