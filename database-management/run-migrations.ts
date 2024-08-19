import { createReadStream } from 'fs';
import * as readline from 'node:readline';
// import { Client } from 'pg';

interface DatabaseConfig {
    user: string;
    password: string | undefined;
    host: string;
    port: number;
    database: string;
}

async function readConfig(): Promise<DatabaseConfig> {
    return new Promise((resolve, reject) => {
        const config: DatabaseConfig = {
            user: '',
            password: undefined,
            host: '',
            port: 0,
            database: '',
        };
        const rl = readline.createInterface({
            input: createReadStream('.dbenv'),
        });

        rl.on('line', (line) => {
            const [key, value] = line.split('=');

            if (key && value) {
                if (key === 'port') {
                    setConfig<keyof DatabaseConfig, number>(config, key as keyof DatabaseConfig, Number(value));
                } else {
                    setConfig<keyof DatabaseConfig, string>(config, key as keyof DatabaseConfig, value);
                }
            } else {
                reject(new Error(`${line} is an invalid env variable`));
            }
        });

        rl.on('close', () => {
            if (Object.keys(config).length === 5) {
                resolve(config as DatabaseConfig);
            } else {
                reject(new Error('Incomplete database configuration'));
            }
        });
    });
}

function setConfig<K extends keyof DatabaseConfig, V extends DatabaseConfig[K]>(
    config: DatabaseConfig,
    key: K,
    value: V,
) {
    config[key] = value;
}

async function connectToDatabase(): Promise<void> {
    const config = await readConfig();
    console.log(config);
    // const client = new Client();
    // await client.connect();

    // console.log(await client.query('SELECT NOW()'));
    // return client;
}

async function databaseManagement() {
    console.log('Connecting to database\n');
    await connectToDatabase();
}

databaseManagement();
