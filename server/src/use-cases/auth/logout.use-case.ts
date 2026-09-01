import type { AuthPort } from "../../core/ports/auth.port";

export class LogoutUseCase {
  constructor(private readonly auth: AuthPort) {}

  execute(accessToken: string): Promise<void> {
    return this.auth.signOut(accessToken);
  }
}