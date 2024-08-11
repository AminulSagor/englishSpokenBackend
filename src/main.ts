import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
config();


async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  const port = process.env.PORT || 3000;
  console.log(`Starting server on port ${port}`);
  await app.listen(port);
  console.log(`Server started on port ${port}`);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
