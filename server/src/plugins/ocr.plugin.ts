import type Elysia from "elysia";
import { MockOcrService } from "../adapters/ocr/mock.ocr.service";
import { GoogleVisionOcrService } from "../adapters/ocr/google-vision.ocr.service";
import { env } from "../lib/env";

export const ocrPlugin = (app: Elysia) => 
  app.decorate('ocrMockService', new MockOcrService())
  .decorate('ocrGoogleVisionService', new GoogleVisionOcrService(env.GOOGLE_VISION_API_KEY || ''));