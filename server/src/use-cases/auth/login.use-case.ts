import type { AuthPort } from "../../core/ports/auth.port";

export class LoginUseCase {
  constructor(private readonly auth: AuthPort) {}

  execute(email: string, password: string) {
    return this.auth.signIn(email, password);
  }
}