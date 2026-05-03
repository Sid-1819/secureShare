import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

type CreateNoteResponseBody = {
  slug: string;
  url: string;
  expiresAt: unknown;
  maxViews: unknown;
};

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('POST /s (create note)', () => {
    it('returns 201 with slug, url, expiresAt, maxViews for valid body', () => {
      return request(app.getHttpServer())
        .post('/s')
        .send({ content: 'hello world' })
        .expect(201)
        .expect((res) => {
          const body = res.body as CreateNoteResponseBody;
          expect(body).toHaveProperty('slug');
          expect(typeof body.slug).toBe('string');
          expect(body.slug.length).toBeGreaterThan(0);
          expect(body).toHaveProperty('url');
          expect(body.url).toContain('/s/' + body.slug);
          expect(body).toHaveProperty('expiresAt');
          expect(body).toHaveProperty('maxViews');
        });
    });

    it('returns 400 when content is missing', () => {
      return request(app.getHttpServer()).post('/s').send({}).expect(400);
    });

    it('returns 400 when content is empty string', () => {
      return request(app.getHttpServer())
        .post('/s')
        .send({ content: '' })
        .expect(400);
    });

    it('returns 400 when content is whitespace only', () => {
      return request(app.getHttpServer())
        .post('/s')
        .send({ content: '   ' })
        .expect(400);
    });

    it('returns 400 when maxViews is less than 1', () => {
      return request(app.getHttpServer())
        .post('/s')
        .send({ content: 'hello', maxViews: 0 })
        .expect(400);
    });

    it('returns 400 when expiresAt is in the past', () => {
      return request(app.getHttpServer())
        .post('/s')
        .send({
          content: 'hello',
          expiresAt: '2020-01-01T00:00:00.000Z',
        })
        .expect(400);
    });
  });
});
