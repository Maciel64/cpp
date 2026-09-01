import type { Elysia } from "elysia";
import type { AuthPort } from "../../core/ports/auth.port";
import { authPlugin } from "../../plugins/auth.plugin";

export class SignUpUseCase {
  constructor(private readonly auth: AuthPort) {}

  execute(email: string, password: string) {
    return this.auth.signUp(email, password);
  }
}
