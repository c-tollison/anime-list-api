import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { AnimeService } from "./anime.service";
import { CreateAnimeDto } from "./dto/create-anime.dto";
import { UpdateAnimeDto } from "./dto/update-anime.dto";

@Controller("anime")
export class AnimeController {
    constructor(private readonly animeService: AnimeService) {}

    @Post()
    async create(@Body() createAnimeDto: CreateAnimeDto) {
        return this.animeService.create(createAnimeDto);
    }

    @Get()
    async getAll(@Query() query: any) {
        return this.animeService.getAll(query);
    }

    @Get(":id")
    async getOne(@Param("id") id: string) {
        return this.animeService.getOne(id);
    }

    @Put(":id")
    async update(@Param("id") id: string, @Body() updateAnimeDto: UpdateAnimeDto) {
        return this.animeService.update(id, updateAnimeDto);
    }

    @Delete(":id")
    async delete(@Param("id") id: string) {
        return this.animeService.delete(id);
    }
}
