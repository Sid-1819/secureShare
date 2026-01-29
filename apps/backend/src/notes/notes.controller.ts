import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service';

@Controller('s')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

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
