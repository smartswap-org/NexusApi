import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "./../app.module";

describe("Health", () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it("/health (GET) should return status ok", async () => {
        const response = await request(app.getHttpServer())
            .get("/health")
            .expect(200);

        expect(response.body).toHaveProperty("status", "ok");
        expect(response.body).toHaveProperty("timestamp");
        expect(typeof response.body.timestamp).toBe("string");
    });
});
