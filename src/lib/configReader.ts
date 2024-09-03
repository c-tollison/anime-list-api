import { createReadStream } from "fs";
import * as readline from "node:readline";

export interface DatabaseConfig {
    user: string;
    password: string | undefined;
    host: string;
    port: number;
    database: string;
}

function setConfig<K extends keyof DatabaseConfig>(config: DatabaseConfig, key: K, value: DatabaseConfig[K]) {
    config[key] = value;
}

export async function readConfig(filepath: string): Promise<DatabaseConfig> {
    return new Promise((resolve, reject) => {
        const config: DatabaseConfig = {
            user: "",
            password: undefined,
            host: "",
            port: 0,
            database: "",
        };
        const rl = readline.createInterface({
            input: createReadStream(filepath),
        });

        rl.on("line", (line) => {
            const [key, value] = line.split("=");

            if (key && value) {
                if (key === "port") {
                    const portNumber = Number(value);
                    if (isNaN(portNumber)) {
                        reject(new Error(`Invalid port number: ${value}`));
                    }

                    setConfig(config, key as keyof DatabaseConfig, portNumber);
                } else {
                    setConfig(config, key as keyof DatabaseConfig, value);
                }
            } else {
                reject(new Error(`${line} is an invalid env variable`));
            }
        });

        rl.on("close", () => {
            if (Object.keys(config).length === 5) {
                resolve(config as DatabaseConfig);
            } else {
                reject(new Error("Incomplete database configuration"));
            }
        });
    });
}
