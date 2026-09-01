import { AppError } from "../errors";

export class ExpenseNotFoundError extends AppError {
  constructor() {
    super("Expense not found", 404, "expense_not_found");
    this.name = "ExpenseNotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("Unauthorized", 401, "unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(`Invalid transition: ${from} -> ${to}`, 409, "invalid_status_transition");
    this.name = "InvalidStatusTransitionError";
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Invalid credentials", 401, "invalid_credentials");
    this.name = "InvalidCredentialsError";
  }
}

export class SignupError extends AppError {
  constructor(message: string) {
    super(message, 400, "auth_error");
    this.name = "SignupError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500, "db_error");
    this.name = "DatabaseError";
  }
}
