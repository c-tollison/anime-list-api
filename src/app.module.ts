import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: "postgres",
            host: "localhost",
            port: 5432,
            password: "",
            username: "catolli",
            entities: [],
            database: "catolli",
            logging: true,
        }),
    ],
})
export class AppModule {}
