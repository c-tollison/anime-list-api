import { readConfig } from "./lib/configReader";
import { DatabaseManager, MigrationType } from "./lib/databaseManager";
import { input, select } from "@inquirer/prompts";
import { mkdir, readdir, writeFile } from "fs/promises";
import path from "path";
import { CONFIG_FILE_PATH, MIGRATIONS_FILE_PATH, MIGRATION_FILE_NAME, ROLLBACK_FILE_NAME } from "./lib/config";
import { readFileSync } from "fs";

enum UserAction {
    NEW = "new",
    RUN_ONE_MIGRATION = "run-one-migration",
    RUN_ONE_ROLLBACK = "run-one-rollback",
    RUN_ALL = "run-all",
    QUIT = "quit",
}

type UserActionType = UserAction | null;

const MIGRATIONS_FOLDER = path.join(__dirname, MIGRATIONS_FILE_PATH);

interface FileConfig {
    migrationFolder: string;
    migrationName: string;
    migrationTypeFile: string;
}

async function getDatabaseManager(): Promise<DatabaseManager> {
    try {
        const config = await readConfig(path.join(__dirname, CONFIG_FILE_PATH));
        return new DatabaseManager(config);
    } catch (error) {
        console.error("Failed to connect to the database:", error);
        process.exit(1);
    }
}

async function getUserAction(): Promise<UserActionType> {
    return await select({
        message: "Select an action",
        choices: [
            {
                name: "New migration",
                value: UserAction.NEW,
                description: "Creates a new timestamped file ready for migration code",
            },
            {
                name: "Run one migration",
                value: UserAction.RUN_ONE_MIGRATION,
                description: "Runs specified migration",
            },
            {
                name: "Run one rollback",
                value: UserAction.RUN_ONE_ROLLBACK,
                description: "Runs specified rollback",
            },
            {
                name: "Run all migrations",
                value: UserAction.RUN_ALL,
                description: "Runs all migrations from diff",
            },
            {
                name: "Quit",
                value: UserAction.QUIT,
            },
        ],
    });
}

async function createMigrationFile() {
    try {
        const fileDescription = await input({
            message: "Enter a description of the migration (Spaces will be replaced with '-')",
        });

        const timestamp = Math.floor(Date.now() / 1000);
        const migrationFile = `${timestamp}-${fileDescription.replace(/\s+/g, "-")}`;
        const migrationPath = path.join(MIGRATIONS_FOLDER, migrationFile);

        await mkdir(migrationPath, { recursive: true });

        const migrationFilePath = path.join(migrationPath, MIGRATION_FILE_NAME);
        const rollbackFilePath = path.join(migrationPath, ROLLBACK_FILE_NAME);

        await writeFile(migrationFilePath, "");
        await writeFile(rollbackFilePath, "");

        console.log(`Created migration files in folder: ${migrationFile}`);
        console.log(`  - ${MIGRATION_FILE_NAME}`);
        console.log(`  - ${ROLLBACK_FILE_NAME}`);
    } catch (error) {
        console.error("Failed to create new migration files:", error);
        throw error;
    }
}

async function readMigrations(): Promise<string[]> {
    try {
        const folders = await readdir(MIGRATIONS_FOLDER);
        folders.sort((a, b) => {
            const firstTime = Number(a.slice(0, 10));
            const secondTime = Number(b.slice(0, 10));

            if (firstTime > secondTime) {
                return 1;
            } else if (secondTime > firstTime) {
                return -1;
            } else {
                return 0;
            }
        });

        return folders;
    } catch (error) {
        throw new Error(`Failed to read from ${MIGRATIONS_FOLDER}`);
    }
}

async function chooseMigration(migrations: string[]): Promise<string | null> {
    try {
        if (migrations.length > 0) {
            const selection = await select({
                message: "Choose migration: ",
                choices: migrations.map((migration) => {
                    return {
                        name: migration,
                        value: migration,
                    };
                }),
            });

            return selection;
        }

        return null;
    } catch (error) {
        throw new Error("Failed to choose migration" + error);
    }
}

async function getFileConfig(migrationFolderName: string, type: MigrationType): Promise<FileConfig> {
    return {
        migrationFolder: MIGRATIONS_FOLDER,
        migrationName: migrationFolderName,
        migrationTypeFile: type === MigrationType.MIGRATION ? MIGRATION_FILE_NAME : ROLLBACK_FILE_NAME,
    };
}

async function filterMigrations(client: DatabaseManager, migrations: string[], type: MigrationType): Promise<string[]> {
    const queryResults = await client.query("SELECT * FROM migrations");
    const ranMigrations: string[] = queryResults.rows.map((migration) => migration.name);

    return migrations.filter((migration) => {
        if (type === MigrationType.MIGRATION && !ranMigrations.includes(migration)) {
            return migration;
        } else if (type === MigrationType.ROLLBACK && ranMigrations.includes(migration)) {
            return migration;
        }
    });
}

async function getEnums(client: DatabaseManager): Promise<Map<string, string[]>> {
    const unsortedEnums: { enum_schema: string; enum_name: string; enum_value: string }[] = (
        await client.query(`SELECT 
                                n.nspname AS enum_schema,
                                t.typname AS enum_name,
                                e.enumlabel AS enum_value
                            FROM 
                                pg_type t
                            JOIN 
                                pg_enum e ON t.oid = e.enumtypid
                            JOIN 
                                pg_catalog.pg_namespace n ON n.oid = t.typnamespace
                            WHERE 
                                n.nspname NOT IN ('pg_catalog', 'information_schema')
                            ORDER BY 
                                enum_schema, enum_name, e.enumsortorder`)
    ).rows;

    const enums: Map<string, string[]> = new Map();
    for (const unsortedEnum of unsortedEnums) {
        const prevValue = enums.get(unsortedEnum.enum_name);

        enums.set(unsortedEnum.enum_name, [...(prevValue || []), unsortedEnum.enum_value]);
    }

    return enums;
}

async function runMigration(
    client: DatabaseManager,
    migrationFolderName: string,
    migrationType: MigrationType,
): Promise<void> {
    const fileConfig = await getFileConfig(migrationFolderName, migrationType);
    const sql = readFileSync(
        path.join(fileConfig.migrationFolder, fileConfig.migrationName, fileConfig.migrationTypeFile),
        "utf-8",
    );

    await client.runMigration(fileConfig.migrationName, sql, migrationType);
}

async function writeEnumsToFiles(enums: Map<string, string[]>) {
    const enumsDir = path.join(__dirname, "enums");

    for (const [key, values] of enums) {
        const enumName = key
            .split("_")
            .map((string) => string.charAt(0).toUpperCase() + string.slice(1))
            .join("");

        const enumValues = values.sort().map(
            // Replace spaces with underscores and get rid of special characters
            (value) => `${value.replace(/\s/g, "_").replace(/\W/g, "").toUpperCase()} = "${value}"`,
        );

        const enumContent = `export enum ${enumName} {\n    ${enumValues.join(",\n    ")},\n}\n`;

        const fileName = `${enumName}.enum.ts`;
        const filePath = path.join(enumsDir, fileName);

        await writeFile(filePath, enumContent);
    }
}

async function databaseManagement() {
    const client = await getDatabaseManager();
    await client.connect();

    try {
        let action: UserActionType = null;

        while (action !== UserAction.QUIT) {
            action = await getUserAction();
            let migrationFolderName: string | null;
            let migrations = await readMigrations();

            switch (action) {
                case UserAction.NEW:
                    await createMigrationFile();
                    break;
                case UserAction.RUN_ONE_MIGRATION:
                    migrations = await filterMigrations(client, migrations, MigrationType.MIGRATION);
                    migrationFolderName = await chooseMigration(migrations);
                    if (migrationFolderName) {
                        await runMigration(client, migrationFolderName, MigrationType.MIGRATION);
                        await writeEnumsToFiles(await getEnums(client));
                    } else {
                        console.log("No migrations to run");
                    }
                    break;
                case UserAction.RUN_ONE_ROLLBACK:
                    migrations = await filterMigrations(client, migrations, MigrationType.ROLLBACK);
                    migrationFolderName = await chooseMigration(migrations);
                    if (migrationFolderName) {
                        await runMigration(client, migrationFolderName, MigrationType.ROLLBACK);
                        await writeEnumsToFiles(await getEnums(client));
                    } else {
                        console.log("No migrations to run");
                    }
                    break;
                case UserAction.RUN_ALL:
                    migrations = await filterMigrations(client, migrations, MigrationType.MIGRATION);
                    for (const migrationName of migrations) {
                        await runMigration(client, migrationName, MigrationType.MIGRATION);
                    }
                    await writeEnumsToFiles(await getEnums(client));
                    break;
                case UserAction.QUIT:
                    break;
                default:
                    console.error("No choice was made");
            }
        }
    } catch (error) {
        console.error("Error during database management: " + error);
    } finally {
        await client.close();
    }
}

databaseManagement();
