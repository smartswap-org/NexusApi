import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NEXUS_ENV! === "dev") {
    const config = new DocumentBuilder()
      .setTitle("Nexus Scope API")
      .setDescription("Nexus Scope API documentation")
      .setVersion("1.0")
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);
  }

  await app.listen(process.env.NEXUS_PORT!);
}
bootstrap();
