import { Router } from 'express';
import { IUser } from '../../database/types/IUser';
import { DatabaseClient } from '../../database/DatabaseClient';
import bcrypt from 'bcrypt';

const router = Router();

export default (parent : Router) => {

    parent.use("/admin", router);
    

    router.get("/list-users", (req, res) => {
        // get all devices from the database
        
        DatabaseClient.Instance.getAllUsers().then((users) => {
            res.send(users);
        });
    });

    router.post("/add-user", async (req, res) => {
        const user = req.body as IUser;

        // Generate a salt
        const salt = bcrypt.genSaltSync(10);

        // Hash the password with the salt
        user.password = bcrypt.hashSync(user.password, salt);

        const success = await DatabaseClient.Instance.insert('users', user);
        if (success) {
            res.send("User added");
        } else {
            res.status(500);
            res.send("Error adding user");
        }
    })
}