import { DatabaseClient } from '../database/DatabaseClient';

const main = async() => {
    const db = new DatabaseClient();
    await db.connect();
    await db.interactiveBrowserDialog();
    await db.disconnect();
    return;
}

main();


