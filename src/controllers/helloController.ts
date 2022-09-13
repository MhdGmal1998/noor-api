import { Request, Response } from "express"

export const Hi = (req: Request, res: Response) => {
  res.send("Hi mom")
}
