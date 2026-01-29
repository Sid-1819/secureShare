import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SecureNote } from '@prisma/client';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async readBySlug(slug: string): Promise<SecureNote | null> {
    const rows = await this.prisma.$queryRaw<SecureNote[]>`
      UPDATE "SecureNote"
      SET "viewCount" = "viewCount" + 1
      WHERE "slug" = ${slug}
        AND "isDeleted" = false
        AND ("expiresAt" IS NULL OR "expiresAt" > now())
        AND ("maxViews" IS NULL OR "viewCount" < "maxViews")
      RETURNING *
    `;
    const note = rows[0] ?? null;
    if (!note) return null;

    if (note.maxViews != null && note.viewCount >= note.maxViews) {
      await this.prisma.secureNote.update({
        where: { id: note.id },
        data: { isDeleted: true },
      });
    }
    return note;
  }
}
