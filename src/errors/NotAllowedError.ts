export class NotAllowedError extends Error {
  code: string
  statusCode: number
  constructor(message?: string, code?: string) {
    super(message || "Operation not allowed")
    this.name = "Not Allowed"
    this.code = code || "NOT_ALLOWED"
    this.statusCode = 403
  }
}
