import type Elysia from "elysia";
import { MockOcrService } from "../adapters/ocr/mock.ocr.service";

export const ocrPlugin = (app: Elysia) => app.decorate('ocrService', new MockOcrService());