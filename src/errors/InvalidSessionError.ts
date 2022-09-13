export class InvalidSessionError extends Error {
  code: string
  statusCode: number
  constructor(message?: string, code?: string) {
    super(message || "Invalid Session")
    this.name = "Invalid Session"
    this.code = code || "INVALID_SESSION"
    this.statusCode = 403
  }
}
