import express, { Express } from "express"

export const createExpressApp = () => {
  const app = express()
  return app
}

export const runExpressServer = (server: Express): void => {
  const PORT = process.env.PORT || 8080
  server.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
}
