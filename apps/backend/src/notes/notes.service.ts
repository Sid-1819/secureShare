import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { SecureNote } from '@prisma/client';

const CACHE_KEY_PREFIX = 'note:';
const CACHE_MAX_TTL_SEC = 3600; // 1 hour

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async readBySlug(slug: string): Promise<SecureNote | null> {
    const cacheKey = `${CACHE_KEY_PREFIX}${slug}`;

    if (this.redis.isEnabled) {
      const cached = await this.redis.get<SecureNote>(cacheKey);
      if (cached) {
        this.incrementViewCountOnly(slug)
          .then(({ invalidate }) => {
            if (invalidate) {
              return this.redis.del(cacheKey);
            }
          })
          .catch(() => {});
        return cached;
      }
    }

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

    if (this.redis.isEnabled) {
      const ttl = this.getCacheTtl(note);
      await this.redis.set(cacheKey, note, ttl);
    }

    if (note.maxViews != null && note.viewCount >= note.maxViews) {
      await this.prisma.secureNote.update({
        where: { id: note.id },
        data: { isDeleted: true },
      });
      if (this.redis.isEnabled) {
        await this.redis.del(cacheKey);
      }
    }
    return note;
  }

  private getCacheTtl(note: SecureNote): number {
    const maxTtl = CACHE_MAX_TTL_SEC;
    if (note.expiresAt == null) {
      return maxTtl;
    }
    const remainingSec = Math.floor(
      (note.expiresAt.getTime() - Date.now()) / 1000,
    );
    if (remainingSec <= 0) return 1;
    return Math.min(remainingSec, maxTtl);
  }

  /**
   * Increments view count for the note by slug. Returns whether cache should be invalidated (maxViews reached).
   */
  private async incrementViewCountOnly(
    slug: string,
  ): Promise<{ invalidate: boolean }> {
    const rows = await this.prisma.$queryRaw<
      { viewCount: number; maxViews: number | null; id: string }[]
    >`
      UPDATE "SecureNote"
      SET "viewCount" = "viewCount" + 1
      WHERE "slug" = ${slug}
        AND "isDeleted" = false
        AND ("expiresAt" IS NULL OR "expiresAt" > now())
        AND ("maxViews" IS NULL OR "viewCount" < "maxViews")
      RETURNING id, "viewCount", "maxViews"
    `;
    const row = rows[0];
    if (!row) return { invalidate: false };
    const invalidate =
      row.maxViews != null && row.viewCount >= row.maxViews;
    if (invalidate) {
      await this.prisma.secureNote.update({
        where: { id: row.id },
        data: { isDeleted: true },
      });
    }
    return { invalidate };
  }
}
