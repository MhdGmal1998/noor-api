import { createDbConnection } from "./infrastructure/typeorm"
import express, { Request, Response, NextFunction } from "express"
import constants from "./util/constants"
import fs from "fs"
import Log from "./util/Log"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import checkStartingConditions from "./lib/startingConditions"
dotenv.config({ path: path.join(__dirname, "..", ".env") })

//@ts-ignore
const routeFileNames = fs
  .readdirSync(`${__dirname}/routes`)
  .filter((f) => f.endsWith(".js"))
const main = async () => {
  const PORT = process.env.PORT || 8080
  const app = express()
  app.use(cors())
  await createDbConnection()
  const url = `/api/${constants.API_VERSION}`
  app.use(express.json())
  app.use((req: Request, _res: Response, next: NextFunction) => {
    Log.debug("Request:" + req.method + "\n" + req.url)
    Log.debug("token: " + req.headers.authorization)
    Log.debug("body: " + JSON.stringify(req.body))
    next()
  })
  for (const route of routeFileNames) {
    const data = require(`./routes/${route}`).default
    app.use(`${url}/${data.path}`, data.router)
    console.log(`${url}/${data.path}`)
  }
  await checkStartingConditions()
  app.listen(PORT, () => Log.info(`Server running on ${PORT}`))
}
main()