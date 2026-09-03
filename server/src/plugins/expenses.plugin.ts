import Elysia from "elysia";
import { authAdapter, authPlugin } from "./auth.plugin";
import { SupabaseExpenseRepository } from "../adapters/supabase/expense.repository";
import { BackblazeStorageAdapter } from "../adapters/storage/backblaze.storage";
import { MockOcrService } from "../adapters/ocr/mock.ocr.service";
import { GoogleVisionOcrService } from "../adapters/ocr/google-vision.ocr.service";
import { ListExpensesUseCase } from "../use-cases/expenses/list-expenses.use-case";
import { SubmitReceiptToOcrUseCase } from "../use-cases/expenses/submit-receipt-to-ocr.use-case";
import { ConfirmExpenseUseCase } from "../use-cases/expenses/confirm-expense.use-case";
import { requireAuth } from "../http/middleware/require-auth";
import { ocrPlugin } from "./ocr.plugin";
import { storagePlugin } from "./storage.plugin";

const repository = new SupabaseExpenseRepository();

export const expensesPlugin = (app: Elysia) =>
  app
    .use(requireAuth(authAdapter))
    .use(authPlugin)
    .use(ocrPlugin)
    .use(storagePlugin)
    .decorate("expensesRepository", repository)
    .derive(({ ocrMockService, ocrGoogleVisionService, storageProvider, expensesRepository }) => ({
      listExpensesUseCase: new ListExpensesUseCase(expensesRepository),
      submitToOcrUseCase: new SubmitReceiptToOcrUseCase(storageProvider, ocrMockService, expensesRepository),
      submitToGoogleOcrUseCase: new SubmitReceiptToOcrUseCase(
        storageProvider,
        ocrGoogleVisionService,
        expensesRepository,
      ),
      confirmExpenseUseCase: new ConfirmExpenseUseCase(expensesRepository),
    }));
