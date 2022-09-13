export class InternalError extends Error {
  code: string
  statusCode: number
  constructor(message?: string, code?: string) {
    super(message || "Something went wrong...")
    this.name = "Internal Error"
    this.code = code || "INTERNAL_ERROR"
    this.statusCode = 500
  }
}
