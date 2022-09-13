declare namespace Express {
  export interface Request {
    user: {
      userId: string
      type: string
      customerId?: string
      providerId?: string
    }
  }
}
