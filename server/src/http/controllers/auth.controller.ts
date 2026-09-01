import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";

export const AuthController = new Elysia({ prefix: "/auth" })
  .use(authPlugin)
  .post(
    "/signup",
    ({ body, signupUseCase }) => signupUseCase.execute(body.email, body.password),
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
    },
  )
  .post(
    "/login",
    ({ body, loginUseCase }) => loginUseCase.execute(body.email, body.password),
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
    },
  )
  .post("/logout", ({ request, logoutUseCase }) => {
    const token = request.headers.get("authorization")?.replace(/^Bearer /i, "") ?? "";
    return logoutUseCase.execute(token);
  })
  .get("/me", async ({ set, request, authProvider }) => {
    const token = request.headers.get("authorization")?.replace(/^Bearer /i, "");
    const user = token ? await authProvider.getUser(token) : null;
    if (!user) {
      set.status = 401;
      return { error: "unauthorized" };
    }
    return { user };
  });
