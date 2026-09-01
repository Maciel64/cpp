import { Elysia } from "elysia";
import type { AuthPort, User } from "../../core/ports/auth.port";
import { UnauthorizedError } from "../../core/errors/domain-errors";

export function requireUser(user: User | null): User {
  if (!user) throw new UnauthorizedError();
  return user;
}

export const requireAuth = (auth: AuthPort) =>
  new Elysia({ name: "auth" })
    .resolve(async ({ headers }) => {
      const token = headers.authorization?.replace(/^Bearer /i, "") ?? null;
      const user = token ? await auth.getUser(token) : null;
      return { token, user };
    })
    .onBeforeHandle(({ set, user }) => {
      if (!user) {
        set.status = 401;
        return { error: "unauthorized" };
      }
    })
    .as("scoped");
