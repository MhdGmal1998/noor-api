import { Request, Response, NextFunction } from "express"
import { Account } from "../entities/Account"
import { Customer } from "../entities/Customer"
import { BadInputError } from "../errors/BadInputError"
import { NotAllowedError } from "../errors/NotAllowedError"
import { NotFoundError } from "../errors/NotFoundError"
import { AppDataSource } from "../infrastructure/typeorm"
import config from "../lib/config"
import {
  denyProviderInactive,
  denyWalletNotOwnerOrCustomer,
} from "../lib/permissions"
import { AccountRepository } from "../repositories/AccountRepo"
import { ConsumptionCodeRepository } from "../repositories/ConsumptionCodeRepository"
import { ProviderRepository } from "../repositories/ProviderRepository"
import { WalletRepository } from "../repositories/WalletRepository"
import { ConsumptionCodeStatus, TransactionTypes } from "../types"
import Log from "../util/Log"
import { makeTransaction } from "./transactionController"

export default class ConsumptionCodeController {
  public async checkCode(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user.providerId)
        throw new NotAllowedError("لا يمكنك القيام بهذه العملية")
      const { code, accountNumber } = req.params
      const CcodeRepo = new ConsumptionCodeRepository(AppDataSource)
      const ccode = await CcodeRepo.getCode(Number(code), (accountNumber))
      if (!ccode) throw new NotFoundError("لم يتم العثور على الكود")
      switch (ccode.status) {
        case ConsumptionCodeStatus.EXPIRED:
          throw new BadInputError("الكود منتهي الصلاحية")
        case ConsumptionCodeStatus.USED:
          throw new BadInputError("الكود مستخدم من قبل")
        case ConsumptionCodeStatus.PENDING:
          const date = ccode.createdAt
          if (
            date.getTime() + config.cCodeExpirationHours * 2 * 60 * 60 * 1000 <
            Date.now()
          ) {
            ccode.status = ConsumptionCodeStatus.EXPIRED
            await CcodeRepo.update(ccode)
            throw new BadInputError("الكود منتهي الصلاحية")
          }
          // get code user
          const user = await new AccountRepository(
            AppDataSource
          ).getByAccountNumber(ccode.accountNumber)
          if (!user) throw new NotFoundError("لم يتم العثور على الحساب")
          console.log(user)
          const customer = await AppDataSource.getRepository(Customer)
            .createQueryBuilder("c")
            .where("c.accountId = :accountId", {
              accountId: user.id,
            })
            .getOne()
          if (!customer) throw new NotFoundError("لم يتم العثور على العميل")
          res.status(200).json({
            ...ccode,
            firstName: customer.firstName,
            lastName: customer.lastName,
          })
          break
      }
      next()
    } catch (error: any) {
      Log.error(`ProviderController.checkCode ${error.message}`)
      res
        .status(error.statusCode ?? 500)
        .json({ error: error.message, code: error.code })
      next()
    }
  }

  public async consumeCode(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user.providerId)
        throw new NotAllowedError("لا يمكنك القيام بهذه العملية")
      const { amount, code, accountNumber } = req.body
      const CcodeRepo = new ConsumptionCodeRepository(AppDataSource)
      const walletRepo = new WalletRepository(AppDataSource)
      const accountRepo = new AccountRepository(AppDataSource)
      const ccode = await CcodeRepo.getCode(Number(code), (accountNumber))
      const acc = await accountRepo.getByAccountNumber(accountNumber, [
        "wallets",
      ])
      if (!acc) throw new NotFoundError("لم يتم العثور على الحساب")
      if (!ccode) throw new NotFoundError("لم يتم العثور على الكود")
      switch (ccode.status) {
        case ConsumptionCodeStatus.EXPIRED:
          throw new BadInputError("الكود منتهي الصلاحية")
        case ConsumptionCodeStatus.USED:
          throw new BadInputError("الكود مستخدم من قبل")
        case ConsumptionCodeStatus.PENDING:
          const date = ccode.createdAt
          if (
            date.getTime() + config.cCodeExpirationHours * 60 * 60 * 1000 <
            Date.now()
          ) {
            ccode.status = ConsumptionCodeStatus.EXPIRED
            await CcodeRepo.update(ccode)
            throw new BadInputError("الكود منتهي الصلاحية")
          }
          if (ccode.amount < amount)
            throw new BadInputError("الكود لا يسمح بهذا المبلغ")
          // all clear, consume code
          const wallet = acc.wallets.find(
            (w) => w.providerId === ccode.providerId
          )
          if (!wallet) throw new NotFoundError("لم يتم العثور على المحفظة")
          if (wallet.balance < amount)
            throw new BadInputError("لا يوجد في المحفظة رصيد كافي")
          const toWallet = await walletRepo.getByAccountIdAndProviderId(
            Number(req.user.userId),
            ccode.providerId
          )
          const trx = await makeTransaction(
            wallet,
            toWallet,
            TransactionTypes.PURCHASE,
            amount,
            0
          )
          ccode.amount -= amount
          if (ccode.amount <= 0) ccode.status = ConsumptionCodeStatus.USED
          await CcodeRepo.update(ccode)
          res.status(200).json(trx)
          break
      }
    } catch (error: any) {
      Log.error(`ProviderController.consumeCode ${error.message}`)
      res
        .status(error.statusCode ?? 500)
        .json({ error: error.message, code: error.code })
      next()
    }
  }

  public async generateConsumeCode(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { amount, walletId } = req.body
      if (!req.user.customerId)
        throw new NotAllowedError("لايمكنك القيام بهذه العملية.")
      const walletRepo = new WalletRepository(AppDataSource)
      const accountRepo = new AccountRepository(AppDataSource)
      const providerRepo = new ProviderRepository(AppDataSource)
      const CcodeRepo = new ConsumptionCodeRepository(AppDataSource)
      const wallet = await walletRepo.getById(walletId)
      if (!wallet) throw new NotFoundError("لم يتم العثور على المرسل!")
      denyWalletNotOwnerOrCustomer(req.user.userId, wallet)
      if (wallet.balance < amount)
        throw new BadInputError("ليس لديك رصيدٌ كافٍ لإتمام هذه العملية")
      if (!wallet.providerId)
        throw new NotAllowedError("لا يمكنك استخدام هذه المحفظة")
      const provider = await providerRepo.getById(wallet.providerId)
      if (!provider) throw new NotFoundError("لم يتم العثور على مزود الخدمة !")
      denyProviderInactive(provider)
      const account = await accountRepo.getById(Number(req.user.userId))
      if (!account) throw new NotFoundError("لم يتم العثور على الحساب!")
      // do the thing
      const code = await CcodeRepo.generateCcode(
        amount,
        account.accountNumber,
        provider.id
      )
      res.status(200).json({ ...code, accountNumber: account.accountNumber })
      next()
    } catch (err: any) {
      Log.error(`trxController.generateConsumeCode: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }
}
