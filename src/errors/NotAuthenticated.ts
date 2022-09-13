export class NotAuthenticatedError extends Error {
  code: string
  statusCode: number
  constructor(message?: string, code?: string) {
    super(message || "Not Authenticated")
    this.name = "Not Authenticated"
    this.code = code || "NO_AUTH"
    this.statusCode = 401
  }
}
