import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { Filter } from './common/filter';
import { Response } from './common/response';
import * as session from 'express-session';
import { AuthGuard } from './common/guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    session({
      secret: 'young-law',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: false,
      },
    }),
  );
  app.use(cookieParser());
  app.useGlobalGuards(new AuthGuard());
  app.useGlobalInterceptors(new Response());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new Filter());

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
