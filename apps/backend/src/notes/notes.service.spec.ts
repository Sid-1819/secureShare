import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { getToken } from '@willsoto/nestjs-prometheus';
import { NotesService } from './notes.service';
import type { CreateNoteDto } from './dto/create-note.dto';

describe('NotesService', () => {
  let service: NotesService;
  let prisma: PrismaService;

  const mockRedis = {
    isEnabled: false,
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    checkRateLimit: jest.fn(),
  };

  const mockNoteReadTotal = { inc: jest.fn() };
  const mockNoteCreateTotal = { inc: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: PrismaService,
          useValue: {
            secureNote: {
              create: jest.fn(),
            },
          },
        },
        { provide: RedisService, useValue: mockRedis },
        { provide: getToken('note_read_total'), useValue: mockNoteReadTotal },
        { provide: getToken('note_create_total'), useValue: mockNoteCreateTotal },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    const dto: CreateNoteDto = {
      content: 'secret message',
    };

    const createdNote = {
      id: 'id-1',
      slug: 'abc123base64url',
      content: dto.content,
      expiresAt: null,
      lastViewedAt: null,
      maxViews: null,
      viewCount: 0,
      isDeleted: false,
      createdAt: new Date(),
      createdBy: null,
      userId: null,
    };

    it('creates a note and returns it with a generated slug', async () => {
      (prisma.secureNote.create as jest.Mock).mockResolvedValue(createdNote);

      const result = await service.create(dto);

      expect(result).toEqual(createdNote);
      expect(prisma.secureNote.create).toHaveBeenCalledTimes(1);
      const call = (prisma.secureNote.create as jest.Mock).mock.calls[0][0];
      expect(call.data).toMatchObject({
        content: dto.content,
        expiresAt: undefined,
        maxViews: undefined,
      });
      expect(call.data.slug).toBeDefined();
      expect(typeof call.data.slug).toBe('string');
      expect(call.data.slug.length).toBeGreaterThan(0);
      expect(mockNoteCreateTotal.inc).toHaveBeenCalledTimes(1);
    });

    it('passes expiresAt and maxViews when provided', async () => {
      const dtoWithOpts: CreateNoteDto = {
        content: 'content',
        expiresAt: '2030-01-01T00:00:00.000Z',
        maxViews: 5,
      };
      (prisma.secureNote.create as jest.Mock).mockResolvedValue({
        ...createdNote,
        expiresAt: new Date(dtoWithOpts.expiresAt!),
        maxViews: 5,
      });

      await service.create(dtoWithOpts);

      const call = (prisma.secureNote.create as jest.Mock).mock.calls[0][0];
      expect(call.data.expiresAt).toEqual(new Date(dtoWithOpts.expiresAt!));
      expect(call.data.maxViews).toBe(5);
    });

    it('retries with new slug on unique constraint violation (P2002)', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: 'x',
      });
      (prisma.secureNote.create as jest.Mock)
        .mockRejectedValueOnce(err)
        .mockResolvedValueOnce(createdNote);

      const result = await service.create(dto);

      expect(result).toEqual(createdNote);
      expect(prisma.secureNote.create).toHaveBeenCalledTimes(2);
      expect(mockNoteCreateTotal.inc).toHaveBeenCalledTimes(1);
    });

    it('rethrows non-P2002 errors', async () => {
      const err = new Error('DB connection failed');
      (prisma.secureNote.create as jest.Mock).mockRejectedValue(err);

      await expect(service.create(dto)).rejects.toThrow('DB connection failed');
      expect(prisma.secureNote.create).toHaveBeenCalledTimes(1);
      expect(mockNoteCreateTotal.inc).not.toHaveBeenCalled();
    });
  });
});
