export class BadInputError extends Error {
  code: string
  statusCode: number
  constructor(message?: string, code?: string) {
    super(message || "Your input was incorrect.")
    this.name = "Bad Input"
    this.code = code || "BAD_INPUT"
    this.statusCode = 400
  }
}
