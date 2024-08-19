// import { Client } from 'pg';

import { readConfig } from "./lib/configReader";

const CONFIG_FILE_PATH = ".dbenv";

async function connectToDatabase(): Promise<void> {
    const config = await readConfig(CONFIG_FILE_PATH);
    console.log(config);
    // const client = new Client();
    // await client.connect();

    // console.log(await client.query('SELECT NOW()'));
    // return client;
}

async function databaseManagement() {
    console.log("Connecting to database\n");
    await connectToDatabase();
}

databaseManagement();
