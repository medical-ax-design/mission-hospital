import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

export async function createApp() {
  return NestFactory.create(AppModule, {
    logger: false,
  });
}

if (process.env.NODE_ENV !== 'test') {
  void createApp().then((app) =>
    app.listen(Number(process.env.PORT ?? 3001)),
  );
}
