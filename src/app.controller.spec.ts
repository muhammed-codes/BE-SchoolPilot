import { Test } from '@nestjs/testing';
import { RequestMethod } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController, RootHealthController } from './app.controller';

describe('Health routes', () => {
  it('preserves the root and API health endpoints for Vercel routing', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController, RootHealthController],
    }).compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: [{ path: '/', method: RequestMethod.GET }],
    });
    await app.init();

    await request(app.getHttpServer() as App)
      .get('/')
      .expect(200)
      .expect(({ body }) => {
        const healthResponse = body as {
          status?: unknown;
          timestamp?: unknown;
        };
        expect(healthResponse.status).toBe('ok');
        expect(healthResponse.timestamp).toEqual(expect.any(String));
      });

    await request(app.getHttpServer() as App)
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => {
        const healthResponse = body as {
          status?: unknown;
          timestamp?: unknown;
        };
        expect(healthResponse.status).toBe('ok');
        expect(healthResponse.timestamp).toEqual(expect.any(String));
      });

    await app.close();
  });
});
