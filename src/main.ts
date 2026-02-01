import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const webUrl = process.env.WEB_URL;
  if (!webUrl) throw new Error('WEB_URL must be set in .env');
  const port = process.env.NEXUS_API_PORT;
  if (!port) throw new Error('NEXUS_API_PORT must be set in .env');
  const env = process.env.ENV;
  if (!env) throw new Error('ENV must be set in .env');

  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.enableCors({
    origin: webUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  if (env === 'dev') {
    const config = new DocumentBuilder()
      .setTitle('Nexus Scope API')
      .setDescription('Nexus Scope API documentation')
      .setVersion('1.0')
      .addCookieAuth('access_token')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(parseInt(port, 10));
}
bootstrap();
