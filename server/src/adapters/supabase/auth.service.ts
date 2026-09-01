import type { AuthPort, AuthSession, User } from "../../core/ports/auth.port";
import { adminClient, publicClient } from "./client";
import {
  InvalidCredentialsError,
  SignupError,
} from "../../core/errors/domain-errors";

export class SupabaseAuthService implements AuthPort {
  async signUp(email: string, password: string): Promise<User> {
    const { data, error } = await publicClient.auth.signUp({ email, password });
    if (error) throw new SignupError(error.message);
    if (!data.user) throw new SignupError("Sign-up did not create a user");
    return { user_id: data.user.id, email: data.user.email ?? null };
  }

  async signIn(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await publicClient.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new InvalidCredentialsError();
    return {
      user_id: data.session.user.id,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  async signOut(accessToken: string): Promise<void> {
    const { error } = await adminClient.auth.admin.signOut(accessToken);
    if (error) throw new SignupError(error.message);
  }

  async getUser(accessToken: string): Promise<User | null> {
    if (!accessToken) return null;
    const { data, error } = await adminClient.auth.getUser(accessToken);
    if (error || !data.user) return null;
    return { user_id: data.user.id, email: data.user.email ?? null };
  }
}