export interface User {
  user_id: string;
  email: string | null;
}

export interface AuthSession {
  user_id: string;
  access_token: string;
  refresh_token: string;
}

export interface AuthPort {
  signUp(email: string, password: string): Promise<User>;
  signIn(email: string, password: string): Promise<AuthSession>;
  signOut(accessToken: string): Promise<void>;
  getUser(accessToken: string): Promise<User | null>;
}