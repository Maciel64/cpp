export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly code: string = "internal_error",
  ) {
    super(message);
    this.name = "AppError";
  }
}