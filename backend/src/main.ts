
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';
import { AppModule } from './app.module';

const server: Express = express();
let isInitialized = false;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: ['Content-Disposition', 'X-Export-Row-Count'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  isInitialized = true;
  return app;
}

// Handler for Vercel Serverless Function
export default async function handler(req: Request, res: Response) {
  if (!isInitialized) {
    await bootstrap();
  }
  return server(req, res);
}

// Start HTTP server only for local dev, Docker, or traditional environments
if (!process.env['VERCEL']) {
  void (async () => {
    const app = await bootstrap();
    const port = process.env['PORT'] ?? 3000;
    await app.listen(port);
    console.log(`Backend server running on http://localhost:${port}/api`);
  })();
}

