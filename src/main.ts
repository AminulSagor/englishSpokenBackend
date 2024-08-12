import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TimeoutInterceptor()); 
  
  const port = process.env.PORT || 3000;
  logger.log(`Starting server on port ${port}`);
  await app.listen(port);
  logger.log(`Server started on port ${port}`);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
