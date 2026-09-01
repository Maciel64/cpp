import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { AppError } from "./core/errors";
import { env } from "./lib/env";
import { authPlugin } from "./plugins/auth.plugin";
import { expensesPlugin } from "./plugins/expenses.plugin";
import { AuthController } from "./http/controllers/auth.controller";
import { ExpensesController } from "./http/controllers/expenses.controller";

const allowedOrigins = env.FRONTEND_ORIGIN.split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const app = new Elysia()
  .use(cors({ origin: allowedOrigins, credentials: true }))
  .onError(({ error, code, set }) => {
    if (error instanceof AppError) {
      set.status = error.status;
      return { error: error.message, code: error.code };
    }
    if (code === "VALIDATION" || code === "PARSE") {
      set.status = 400;
      return { error: (error as Error).message, code: "invalid_request" };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "route not found", code: "not_found" };
    }
    set.status = 500;
    return { error: "internal_server_error", code: "internal_error" };
  })
  .use(authPlugin)
  .use(expensesPlugin)
  .use(AuthController)
  .use(ExpensesController)

export default app;
