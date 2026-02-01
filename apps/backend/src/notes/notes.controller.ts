import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { RateLimitGuard } from '../redis/rate-limit.guard';
import { NotesService } from './notes.service';

@Controller('s')
@UseGuards(RateLimitGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createNote(@Body() dto: CreateNoteDto) {
    const note = await this.notesService.create(dto);
    return { slug: note.slug };
  }

  @Get(':slug')
  async readNote(@Param('slug') slug: string) {
    const note = await this.notesService.readBySlug(slug);

    if (!note) {
      throw new NotFoundException();
    }

    return {
      content: note.content,
    };
  }
}
