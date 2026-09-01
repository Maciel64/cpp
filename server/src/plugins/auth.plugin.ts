import Elysia from "elysia";
import { SupabaseAuthService } from "../adapters/supabase/auth.service";
import { SignUpUseCase } from "../use-cases/auth/signup.use-case";
import { LoginUseCase } from "../use-cases/auth/login.use-case";
import { LogoutUseCase } from "../use-cases/auth/logout.use-case";

export const authAdapter = new SupabaseAuthService();

export const authPlugin = (app: Elysia) => app
  .decorate('authProvider', authAdapter).derive(({
    authProvider
  }) => ({
    signupUseCase: new SignUpUseCase(authProvider),
    loginUseCase: new LoginUseCase(authProvider),
    logoutUseCase: new LogoutUseCase(authProvider),
  }))