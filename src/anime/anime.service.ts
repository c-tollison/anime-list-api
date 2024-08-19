import { Injectable } from "@nestjs/common";
import { CreateAnimeDto } from "./dto/create-anime.dto";
import { UpdateAnimeDto } from "./dto/update-anime.dto";

@Injectable()
export class AnimeService {
    create(anime: CreateAnimeDto) {
        console.log(anime);
        return { body: "create" };
    }

    getAll(query: any) {
        console.log(query);
        if (query.name) {
            return { body: "get all parameters" };
        } else {
            return { body: "get all no parameters" };
        }
    }

    getOne(animeId: string) {
        console.log(animeId);
        return { body: "got one" };
    }

    update(animeId: string, animeDto: UpdateAnimeDto) {
        console.log(animeId);
        console.log(animeDto);
        return { body: "update" };
    }

    delete(animeId: string) {
        console.log(animeId);
        return { body: "delete" };
    }
}
