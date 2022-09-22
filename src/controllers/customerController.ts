import { NextFunction, Request, Response } from "express"
import { Customer } from "../entities/Customer"
import { AppDataSource } from "../infrastructure/typeorm"
import jwt from "jsonwebtoken"
import Log from "../util/Log"
import constants from "../util/constants"
import { Account } from "../entities/Account"
import { AccountRepository } from "../repositories/AccountRepo"
import generateNumber from "../util/generateNumber"
import config from "../lib/config"
import { EntityManager } from "typeorm"
import { UserTypes } from "../types"
import { SessionRepository } from "../repositories/SessionRepo"
import { CustomerRepository } from "../repositories/CustomerRepository"
import { BadInputError } from "../errors/BadInputError"
import { NotFoundError } from "../errors/NotFoundError"
import { NotAllowedError } from "../errors/NotAllowedError"

export default class CustomerController {
  public async getCustomerInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const repo = new CustomerRepository(AppDataSource)
      const id = Number(req.body.user.customerId)
      if (!id) throw new BadInputError("هذا الحساب غير صحيح")
      const customer = await repo.getById(id, ["account", "account.wallets"])
      if (!customer) throw new NotFoundError("الحساب غير موجود")
      res.status(200).json({
        currentBalance: Number(
          customer.account.wallets
            .reduce((acc, cur) => acc + cur.balance, 0)
            .toFixed(2)
        ),
        totalConsume: Number(
          customer.account.wallets
            .reduce((acc, cur) => acc + cur.totalConsume, 0)
            .toFixed(2)
        ),
      })
    } catch (error: any) {
      Log.error(`CustomerController.getCustomerInfo ${error.message}`)
      res.status(500).json({ error: error.message })
      next()
    }
  }

  public async createCustomerAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await AppDataSource.manager.transaction(
        async (em: EntityManager) => {
          let customer = new Customer()
          customer.firstName = req.body.firstName
          customer.lastName = req.body.lastName
          customer.email = req.body.email
          customer.phoneNumber = req.body.phoneNumber
          customer.language = req.body.language
          customer.isInvestor = req.body.isInvestor ?? false
          customer.isVolunteer = req.body.isVolunteer ?? false
          customer.isBusinessOwner = req.body.isBusinessOwner ?? false
          // create customer account number
          const accountNumber = req.body.phoneNumber
          await generateAccountNumber(new AccountRepository(AppDataSource))
          let account = new Account()
          account.username = req.body.username
          account.password = req.body.password
          account.accountNumber = accountNumber
          account.type = UserTypes.CUSTOMER
          account = await em.save(account)
          // const account = await AppDataSource.getRepository(Account).save({
          // username: req.body.username,
          // password: req.body.password,
          // accountNumber,
          // })
          customer.accountId = account.id
          customer = await em.save(customer)
          // immediately login
          const token = jwt.sign(
            {
              userId: account.id,
              type: constants.TYPE_CUSTOMER,
              customerId: customer.id,
            },
            config.JWT_SECRET ?? ""
          )
          return { token, id: account.id, acn: account.accountNumber }
        }
      )
      const repo = new SessionRepository(AppDataSource)
      await repo.startNewSession(result.token, result.id)
      res.status(201).json({
        message: "Customer account created successfully!",
        token: result.token,
        accountNumber: result.acn,
      })
      return next()
    } catch (error: any) {
      Log.error(`CustomerController.createCustomerAccount ${error.message}`)
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ message: "اسم الحساب أو البريد الإلكتروني مستعمل بالفعل." })
      }
      res.status(500).json({ error: error.message })
      next()
    }
  }

  public async editCustomerProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const customerRepo = new CustomerRepository(AppDataSource)
      const { customerId } = req.body.user
      if (!customerId) throw new NotAllowedError("لم يتم التحقق من الحساب")
      let customer = await customerRepo.getById(Number(customerId))
      if (!customer) throw new NotFoundError("لم يتم العثور على العميل")
      Object.assign(customer, req.body)
      customer = await customerRepo.update(customer)
      res.status(200).json(customer)
      next()
    } catch (error: any) {
      Log.error(`CustomerController.editCustomerProfile ${error.message}`)
      res
        .status(error.statusCode ?? 500)
        .json({ error: error.message, code: error.code })
      next()
    }
  }
}

export const generateAccountNumber = async (
  repo: AccountRepository
): Promise<number> => {
  const number = generateNumber(config.accountNumberLength)
  const acc = await repo.getByAccountNumber(number)
  if (acc) return generateAccountNumber(repo)
  return number
}
