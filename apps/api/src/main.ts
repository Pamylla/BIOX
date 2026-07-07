import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";

/** Boots the NestJS HTTP server. All routes are namespaced under /v1. */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("v1");

  const port = process.env.PORT ? Number(process.env.PORT) : 3333;
  await app.listen(port);

  Logger.log(`BIOX API listening on http://localhost:${port}/v1`, "Bootstrap");
}

void bootstrap();
