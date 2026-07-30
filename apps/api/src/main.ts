import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

export async function createApp() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  void createApp().then((app) =>
    app.listen(Number(process.env.PORT ?? 3001)),
  );
}
