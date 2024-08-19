import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Anime {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
