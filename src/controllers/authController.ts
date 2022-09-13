import { NextFunction, Request, Response } from "express"
import { InvalidCredentialsError } from "../errors/InvalidCreds"
import { AppDataSource } from "../infrastructure/typeorm"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import Log from "../util/Log"
import { CustomerStatus, ProviderStatus, UserTypes } from "../types"
import { Account } from "../entities/Account"
import { NotFoundError } from "../errors/NotFoundError"
import config from "../lib/config"
import { SessionRepository } from "../repositories/SessionRepo"
import { AccountRepository } from "../repositories/AccountRepo"
import { PasswordResetRepository } from "../repositories/PasswordResetRepo"
import { randomUUID } from "crypto"
import { mail } from "../util/mail"
import dotenv from "dotenv"
import path from "path"
import { NotAllowedError } from "../errors/NotAllowedError"
import { CashierRepository } from "../repositories/CashierRepository"
import { ProviderRepository } from "../repositories/ProviderRepository"
import { CustomerRepository } from "../repositories/CustomerRepository"
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") })

export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const secret = config.JWT_SECRET ?? ""
      const { loginType, username, password } = req.body
      const repo = new SessionRepository(AppDataSource)
      const accountRepo = new AccountRepository(AppDataSource)
      let account = await AppDataSource.getRepository(Account).findOne({
        where: { username },
        relations: ["wallets"],
        select: ["accountNumber", "id", "password", "type"],
      })
      if (!account || !bcrypt.compareSync(password, account.password))
        throw new InvalidCredentialsError("معلومات الدخول غير صحيحة")
      switch (loginType) {
        case "provider":
          const providerRepo = new ProviderRepository(AppDataSource)
          let provider = await providerRepo.getByAccountId(account.id)
          let providerId: number,
            accountId = account.id
          if (!provider) {
            // check if there's a cashier with this data
            const cashierRepo = new CashierRepository(AppDataSource)
            const cashier = await cashierRepo.getByAccountId(account.id, [
              "provider",
              "provider.account",
            ])
            if (!cashier || !cashier.provider)
              throw new NotFoundError("لم يتم العثور على المستخدم")
            provider = cashier.provider
            providerId = cashier.provider.id
            accountId = cashier.provider.accountId
            account = cashier.provider.account
          } else providerId = provider.id
          // check if the provider is active
          if (provider.status !== ProviderStatus.ACTIVE)
            throw new NotAllowedError("المستخدم غير مفعل")
          if (account.lastLogin) {
            const daysSinceLastLogin = Math.floor(
              (Date.now() - new Date(account.lastLogin).getTime()) /
                (1000 * 60 * 60 * 24)
            )
            if (daysSinceLastLogin >= 30) {
              provider.status = ProviderStatus.BANNED
              await providerRepo.update(provider)
              res.status(403).json("تم حظر هذا الحساب.")
            }
          }
          const providerToken = jwt.sign(
            {
              userId: accountId,
              type: UserTypes.PROVIDER,
              providerId: providerId,
            },
            secret
          )
          account.lastLogin = new Date()
          await accountRepo.update(account)
          await repo.startNewSession(providerToken, account.id, false)
          return res.status(200).json({
            token: providerToken,
            provider,
            wallets: account.wallets,
            accountNumber: account.accountNumber,
          })
        case "customer":
          const customerRepo = new CustomerRepository(AppDataSource)
          const customer = await customerRepo.getByAccountId(account.id)
          if (!customer) throw new NotFoundError("Customer not found!")
          if (customer.status === CustomerStatus.BANNED)
            throw new NotAllowedError("هذا الحساب محظور.")
          if (account.lastLogin) {
            const daysSinceLastLogin = Math.floor(
              (Date.now() - account.lastLogin.getTime()) / (1000 * 60 * 60 * 24)
            )
            if (daysSinceLastLogin >= 30) {
              customer.status = CustomerStatus.BANNED
              await customerRepo.update(customer)
              res.status(403).json("تم حظر هذا الحساب لعدم النشاط.")
            }
          }
          const customerToken = jwt.sign(
            { userId: account.id, type: account.type, customerId: customer.id },
            secret
          )
          await repo.startNewSession(customerToken, account.id)
          account.lastLogin = new Date()
          await accountRepo.update(account)
          return res.status(200).json({
            token: customerToken,
            customer,
            wallets: account.wallets,
            accountNumber: account.accountNumber,
          })
        case "admin":
          const adminToken = jwt.sign(
            { userId: account.id, type: account.type },
            secret
          )
          await repo.startNewSession(adminToken, account.id)
          return res.status(200).json({
            token: adminToken,
            wallets: account.wallets,
            accountNumber: account.accountNumber,
          })
        default:
          throw new InvalidCredentialsError("معلومات الدخول غير صحيحة")
      }
    } catch (error: any) {
      Log.error(`authController.login: ${error}`)
      res.status(error.statusCode ?? 500).json({ error: error.message })
      return next()
    }
  }

  public async sendResetPasswordEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, username } = req.body
      const repo = new AccountRepository(AppDataSource)
      const account = await repo.getByUsername(username)
      if (!account) throw new NotFoundError("Account not found!")
      const resetRepo = new PasswordResetRepository(AppDataSource)
      const uuid = randomUUID()
      await resetRepo.create({ uuid, accountId: account.id })
      // #TODO don't do this
      const newPassword = Math.random().toString(36).substring(2, 6) // random string of length 4
      // mail things to the user
      await mail(
        email,
        "Password Reset",
        `Your new password is: ${newPassword}`
      )
      account.password = newPassword
      await repo.update(account)
      res.status(200).json("يرجى مراجعة بريدك الإلكتروني.")
      next()
    } catch (error: any) {
      Log.error(`authController.resetPassword: ${error}`)
      res.status(error.statusCode ?? 500).json({ error: error.message })
      return next()
    }
  }

  public async resetPasswordCheck(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { uuid } = req.params
      const repo = new PasswordResetRepository(AppDataSource)
      const reset = await repo.getByUUID(uuid)
      if (!reset || !reset.isValid) throw new NotFoundError("uuid not found")
      res.status(200).json(reset.account)
      next()
    } catch (error: any) {
      Log.error(`authController.resetPasswordCheck: ${error}`)
      res.status(error.statusCode ?? 500).json({ error: error.message })
      return next()
    }
  }
  // public async test(req: Request, res: Response, next: NextFunction) {
  // Log.debug("TEST")
  // return res.json(req.user)
  // }
}
