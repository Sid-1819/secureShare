import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async readBySlug(slug: string) {
    const note = await this.prisma.secureNote.findUnique({
      where: { slug },
    });

    if (!note) return null;

    if (note.isDeleted) return null;

    if (note.expiresAt && note.expiresAt < new Date()) {
      await this.prisma.secureNote.update({
        where: { id: note.id },
        data: { isDeleted: true },
      });
      return null;
    }

    if (note.maxViews && note.viewCount >= note.maxViews) {
      await this.prisma.secureNote.update({
        where: { id: note.id },
        data: { isDeleted: true },
      });
      return null;
    }

    await this.prisma.secureNote.update({
      where: { id: note.id },
      data: {
        viewCount: { increment: 1 },
      },
    });

    return note;
  }
}
