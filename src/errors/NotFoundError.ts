export class NotFoundError extends Error {
  code: string
  statusCode: number
  constructor(message?: string, code?: string) {
    super(message || "Data Not Found")
    this.name = "Not Found"
    this.code = code || "NOT_FOUND"
    this.statusCode = 404
  }
}
