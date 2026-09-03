import { Elysia, t } from "elysia";
import { expensesPlugin } from "../../plugins/expenses.plugin";
import { requireUser } from "../middleware/require-auth";

const statusEnum = t.Enum({
  pending_review: "pending_review",
  needs_attention: "needs_attention",
  confirmed: "confirmed",
});

export const ExpensesController = new Elysia({ prefix: "/expenses" })
  .use(expensesPlugin)
  .get(
    "/",
    ({ query, user, listExpensesUseCase }) =>
      listExpensesUseCase.execute({
        user_id: requireUser(user).user_id,
        status: query.status,
        from: query.from,
        to: query.to,
        vendor: query.vendor,
        page: query.page ?? 1,
        page_size: query.page_size ?? 10,
      }),
    {
      query: t.Object({
        status: t.Optional(statusEnum),
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
        vendor: t.Optional(t.String()),
        page: t.Optional(t.Numeric({ minimum: 1 })),
        page_size: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
      }),
    },
  )
  .post(
    "/",
    async ({ body, user, submitToOcrUseCase }) => {
      const bytes = new Uint8Array(await body.file.arrayBuffer());
      return submitToOcrUseCase.execute({
        userId: requireUser(user).user_id,
        filename: body.file.name,
        contentType: body.file.type || "application/octet-stream",
        bytes,
      });
    },
    {
      body: t.Object({ file: t.File() }),
    },
  )
  // OCR real via Google Vision — o frontend pode escolher entre este e o mock.
  .post(
    "/ocr",
    async ({ body, user, submitToGoogleOcrUseCase }) => {
      const bytes = new Uint8Array(await body.file.arrayBuffer());
      return submitToGoogleOcrUseCase.execute({
        userId: requireUser(user).user_id,
        filename: body.file.name,
        contentType: body.file.type || "application/octet-stream",
        bytes,
      });
    },
    {
      body: t.Object({ file: t.File() }),
    },
  )
  .get(
    "/:id",
    ({ params, user, expensesRepository }) =>
      expensesRepository.getById(params.id, requireUser(user).user_id),
    {
      params: t.Object({ id: t.String() }),
    },
  )
  .get(
    "/:id/receipt-url",
    async ({ params, user, expensesRepository, storageProvider }) => {
      const expense = await expensesRepository.getById(
        params.id,
        requireUser(user).user_id,
      );
      if (!expense?.receipt_key) return { url: null };
      return { url: await storageProvider.getSignedDownloadUrl(expense.receipt_key) };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )
  .post(
    "/:id/confirm",
    ({ params, user, body, confirmExpenseUseCase }) =>
      confirmExpenseUseCase.execute(
        params.id,
        requireUser(user).user_id,
        body,
      ),
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        vendor: t.Optional(t.String()),
        amount: t.Optional(t.Number({ gt: 0 })),
        currency: t.Optional(t.String()),
        date: t.Optional(t.String()),
      }),
    },
  );
