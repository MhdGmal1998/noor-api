export class InvalidCredentialsError extends Error {
  code: string
  statusCode: number
  constructor(message?: string, code?: string) {
    super(message || "Inavlid Credentials")
    this.name = "Invalid Credentials"
    this.code = code || "INVALID_CREDENTIALS"
    this.statusCode = 403
  }
}
