import { NextFunction, Request, Response } from "express"
import { NotAuthenticatedError } from "../errors/NotAuthenticated"
import jwt from "jsonwebtoken"
import Log from "../util/Log"
import { CustomerStatus, ProviderStatus, UserTypes } from "../types"
import { AppDataSource } from "../infrastructure/typeorm"
import config from "../lib/config"
import { NotAllowedError } from "../errors/NotAllowedError"
import { Provider } from "../entities/Provider"
import { NotFoundError } from "../errors/NotFoundError"
import { Customer } from "../entities/Customer"
import { SessionRepository } from "../repositories/SessionRepo"
import { InvalidSessionError } from "../errors/InvalidSessionError"

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")
    const repo = new SessionRepository(AppDataSource)
    if (!token) throw new NotAuthenticatedError()
    const session = await repo.findByToken(token)
    Log.debug("FOUND SEESSION")
    console.log(session)
    if (!session) throw new InvalidSessionError("لقد تم تسجيل خروجك من حسابك")
    const decoded = jwt.verify(token, config.JWT_SECRET ?? "")
    req.user = decoded as {
      userId: string
      type: UserTypes
      customerId: string
      providerId: string
    }
    next()
  } catch (err: any) {
    Log.error(`middleware.authenticate: ${err.message}`)
    res
      .status(err.statusCode ?? 401)
      .json({ message: err.message, code: err.code })
  }
}

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user
    if (!user) throw new NotFoundError("User not found")
    if (user.type !== UserTypes.ADMIN) throw new NotAllowedError()
    next()
  } catch (err: any) {
    Log.error(`middleware.isAdmin: ${err.message}`)
    res
      .status(err.statusCode ?? 401)
      .json({ message: err.message, code: err.code })
  }
}

export const isActiveUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.userId
    if (!userId) throw new NotAuthenticatedError()
    if (req.user.type === UserTypes.ADMIN) {
      // admins are active by default
      return next()
    }
    const repo =
      req.user.type === UserTypes.PROVIDER
        ? AppDataSource.getRepository(Provider)
        : AppDataSource.getRepository(Customer)
    const user = await repo.findOneBy({ accountId: Number(userId) })
    if (!user) throw new NotAuthenticatedError()
    if (
      user.status !== ProviderStatus.ACTIVE &&
      user.status !== CustomerStatus.ACTIVE
    )
      throw new NotAllowedError("هذا الحساب غير مفعّل")
    next()
  } catch (err: any) {
    Log.error(`middleware.isActiveProvider: ${err.message}`)
    res
      .status(err.statusCode ?? 401)
      .json({ message: err.message, code: err.code })
  }
}
