import { Request, Response, NextFunction } from "express"
import { EntityManager, Repository } from "typeorm"
import { Account } from "../entities/Account"
import { Customer } from "../entities/Customer"
import { Provider } from "../entities/Provider"
import { Transaction } from "../entities/Transaction"
import { Wallet } from "../entities/Wallet"
import { BadInputError } from "../errors/BadInputError"
import { InternalError } from "../errors/InternalError"
import { NotFoundError } from "../errors/NotFoundError"
import { AppDataSource } from "../infrastructure/typeorm"
import config from "../lib/config"
import { denyProviderInactive } from "../lib/permissions"
import { AccountRepository } from "../repositories/AccountRepo"
import { AffiliateRepository } from "../repositories/AffiliateRepo"
import { CashierRepository } from "../repositories/CashierRepository"
import { CustomerRepository } from "../repositories/CustomerRepository"
import { ProviderRepository } from "../repositories/ProviderRepository"
import { TransactionRepository } from "../repositories/TransactionRepository"
import { WalletRepository } from "../repositories/WalletRepository"
import {
  CustomerStatus,
  ProviderStatus,
  TransactionStatus,
  TransactionTypes,
  UserTypes,
  WalletStatus,
  WalletTypes,
} from "../types"
import generateNumber from "../util/generateNumber"
import Log from "../util/Log"
import { generateAccountNumber } from "./customerController"

export default class AdminController {
  // should be verified admin first #TODO
  public async getPendingProviders(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const providerRepo = AppDataSource.getRepository(Provider)
      const providers = await providerRepo.find({
        where: {
          status: ProviderStatus.PENDING,
        },
      })
      res.status(200).json(providers)
      next()
    } catch (error: any) {
      Log.error(error.message)
      res.status(error.statusCode ?? 500).json({
        code: error.code,
        error: error.message,
      })
      next()
    }
  }

  public async approveProvider(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const providerRepo = new ProviderRepository(AppDataSource)
      const provider = await providerRepo.getById(req.body.providerId, [
        "account",
        "account.wallets",
      ])
      if (!provider) throw new NotFoundError("لم يتم العثور على المزود")
      if (provider.status === ProviderStatus.ACTIVE)
        throw new BadInputError("مزود الخدمة مفعل بالفعل")
      provider.status = ProviderStatus.ACTIVE
      // provider.account.wallets[0].fees = 2
      await providerRepo.update(provider)
      res.status(200).json({
        message: "Provider approved successfully",
        updatedAt: provider.updatedAt,
      })
      next()
    } catch (error: any) {
      Log.error(`adminController.approveProvider: ${error.message}`)
      res.status(error.statusCode ?? 500).json({
        code: error.code,
        error: error.message,
      })
      next()
    }
  }

  public async getAllAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const accountRepo = new AccountRepository(AppDataSource)
      const accounts = await accountRepo.getAll()
      res.status(200).json(accounts)
      next()
    } catch (error: any) {
      Log.error(`adminController.approveProvider: ${error.message}`)
      res.status(error.statusCode ?? 500).json({
        code: error.code,
        error: error.message,
      })
      next()
    }
  }

  public async listProviders(_req: Request, res: Response, next: NextFunction) {
    try {
      // const providerRepo = AppDataSource.getRepository(Provider)
      const providers = (await AppDataSource.createQueryBuilder("provider", "p")
        .where("p.status = :status AND isSystem = false", {
          status: ProviderStatus.ACTIVE,
        })
        .leftJoinAndSelect("p.account", "acc")
        .leftJoinAndSelect("acc.wallets", "wallets")
        .getMany()) as Provider[]
      // find system wallets at these providers
      const systemWallets = await AppDataSource.createQueryBuilder(
        "wallet",
        "w"
      )
        .where(
          "w.walletType = 'SYSTEM' AND w.providerId IN (:...providerIds)",
          { providerIds: providers.map((p) => p.id) }
        )
        .leftJoinAndSelect("w.records", "r")
        .getMany()
      res.status(200).json({
        providers,
        systemWallets,
      })
      next()
    } catch (error: any) {
      Log.error(`adminController.approveProvider: ${error.message}`)
      res.status(error.statusCode ?? 500).json({
        code: error.code,
        error: error.message,
      })
      next()
    }
  }

  public async generateProviderCredit(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // input: pointType, pointValue, providerId, notes,
      // verification: admin
      // create a wallet for the provider
      // add points to the wallet
      const { providerId, pointType, pointAmount, bonus, fees } = req.body
      const providerRepo = AppDataSource.getRepository(Provider)
      const accountRepo = new AccountRepository(AppDataSource)
      const provider = await providerRepo.findOne({
        where: { id: providerId },
      })
      if (!provider) throw new NotFoundError("لم يتم العثور على المزود")
      const account = await accountRepo.getById(provider.accountId, ["wallets"])
      if (!account) throw new InternalError("no account for this provider.")
      let walletsOfPointType = account.wallets.filter(
        (w) => w.pointType === pointType
      )
      let wallet: Wallet | undefined
      wallet = walletsOfPointType.find((w) => w.bonus === bonus)
      const walletRepo = AppDataSource.getRepository(Wallet)
      // no wallet of the same bonus/fees, create a new one from scratch
      if (!wallet || wallet.status === WalletStatus.INACTIVE) {
        wallet = new Wallet()
        wallet.walletNumber = await generateWalletNumber(walletRepo)
        wallet.pointType = pointType
        wallet.walletType = WalletTypes.PROVIDER
        wallet.balance = pointAmount
        wallet.accountId = account.id
        wallet.bonus = bonus
        wallet.providerId = provider.id
        wallet.fees = fees
        await walletRepo.save(wallet)
      } else {
        // wallet exists, add points to it
        // #TODO warn admin that changing fees results in a new wallet.
        // #TODO changing fees should result in new wallet?
        if (wallet.fees !== fees) {
          // fees changed, change them for all other wallest
          wallet.fees = fees
          await walletRepo.save(wallet)
        }
        wallet.balance += pointAmount
        await walletRepo.save(wallet)
      }
      const originWallet = await new WalletRepository(
        AppDataSource
      ).getOriginWallet()
      let trx = new Transaction()
      trx.status = TransactionStatus.CONFIRMED
      trx.transactionType = TransactionTypes.TRANSFER
      trx.amount = pointAmount
      trx.fromWalletId = originWallet!.id
      trx.toWalletId = wallet.id
      trx.trxNumber = generateNumber(9)
      trx = await new TransactionRepository(AppDataSource).create(trx)
      res.status(200).json(trx)
      next()
    } catch (error: any) {
      Log.error(`adminController.generateProviderCredit: ${error.message}`)
      res.status(error.statusCode ?? 500).json({
        error: error.message,
        code: error.code,
      })
      next()
    }
  }

  public async getProviderById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // const providerRepo = AppDataSource.getRepository(Provider)
      const providerId = Number(req.params.providerId)
      const query = await AppDataSource.getRepository(Provider)
        .createQueryBuilder("p")
        .where("p.id = :providerId", { providerId })
        .leftJoinAndSelect("p.account", "acc")
        .leftJoinAndSelect("acc.wallets", "wallets")
        .leftJoinAndSelect("p.cashiers", "cashiers")
        .getOne()
      const totalPoints = await AppDataSource.getRepository(Wallet)
        .createQueryBuilder("w")
        .where("w.providerId = :providerId", { providerId })
        .leftJoinAndSelect("w.records", "r")
        .getMany()
      // console.lo
      // const providers = providerRepo.findAndCount({
      // relations: ["account", "account.wallets"],
      // })
      // const accounts = await accountRepo.getAll()
      res.status(200).json({
        provider: query,
        totalPoints: Number(
          totalPoints.reduce((tot, cur) => tot + cur.balance, 0).toFixed(2)
        ),
      })
      next()
    } catch (error: any) {
      Log.error(`adminController.getProviderById: ${error.message}`)
      res.status(error.statusCode ?? 500).json({
        code: error.code,
        error: error.message,
      })
      next()
    }
  }

  public async editProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = req.body as Provider
      const providerRepo = new ProviderRepository(AppDataSource)
      res.status(200).json(await providerRepo.update(provider))
      next()
    } catch (error: any) {
      Log.error(`adminController.editProvider: ${error.message}`)
      res.status(error.statusCode ?? 500).json({
        code: error.code,
        error: error.message,
      })
      next()
    }
  }

  public async editCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = req.body as Customer
      const customerRepo = new CustomerRepository(AppDataSource)
      res.status(200).json(await customerRepo.update(customer))
      next()
    } catch (error: any) {
      Log.error(`adminController.editCustomer: ${error.message}`)
      res.status(error.statusCode ?? 500).json({
        code: error.code,
        error: error.message,
      })
      next()
    }
  }

  public async customerList(req: Request, res: Response, next: NextFunction) {
    try {
      const customerRepo = new CustomerRepository(AppDataSource)
      const customers = await customerRepo.getAll([
        "account",
        "account.wallets",
      ])
      res.status(200).json(customers)
    } catch (error: any) {
      Log.error(`adminController.customerList: ${error.message}`)
      res.status(error.statusCode ?? 500).json({
        code: error.code,
        error: error.message,
      })
      next()
    }
  }

  public async getAdminInformation(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const wallets = await AppDataSource.getRepository(Wallet)
        .createQueryBuilder("w")
        .where("w.walletType IN(:...types)", {
          types: [WalletTypes.SYSTEM, WalletTypes.ORIGIN],
        })
        .leftJoinAndSelect("w.records", "r")
        .getMany()
      // trx
      const trxs = wallets.length
        ? await AppDataSource.getRepository(Transaction)
            .createQueryBuilder("trx")
            .where(
              "trx.fromWalletId IN(:...ids) OR trx.toWalletId IN(:...ids)",
              {
                ids: wallets.map((w) => w.id) ?? [0],
              }
            )
            .innerJoinAndSelect("trx.fromWallet", "fromWallet")
            .innerJoinAndSelect("trx.toWallet", "toWallet")
            .orderBy("trx.createdAt", "DESC")
            .take(10)
            .getMany()
        : []
      const arr = []
      const accountRepo = new AccountRepository(AppDataSource)
      for (const trx of trxs) {
        //id of the other person
        const senderId = trx.fromWallet.accountId
        const sender = await accountRepo.getById(senderId)
        if (!sender) continue
        let senderName: string = ""
        switch (sender.type) {
          case UserTypes.CUSTOMER:
            const cst = await AppDataSource.getRepository(Customer).findOne({
              where: {
                accountId: senderId,
              },
              select: ["firstName", "lastName"],
            })
            if (!cst) continue
            senderName = cst.firstName + " " + cst.lastName
            break
          case UserTypes.PROVIDER:
            const prv = await AppDataSource.getRepository(Provider).findOne({
              where: { accountId: senderId },
              select: ["businessName"],
            })
            senderName = prv?.businessName ?? ""
            break
          default:
            senderName = "SYSTEM"
            break
        }
        if (!senderName) continue
        //id of the other person
        const recieverId = trx.toWallet.accountId
        const reciever = await accountRepo.getById(recieverId)
        if (!reciever) continue
        let reciverName: string = ""
        switch (reciever.type) {
          case UserTypes.CUSTOMER:
            const cst = await AppDataSource.getRepository(Customer).findOne({
              where: {
                accountId: recieverId,
              },
              select: ["firstName", "lastName"],
            })
            if (!cst) continue
            reciverName = cst.firstName + " " + cst.lastName
            break
          case UserTypes.PROVIDER:
            const prv = await AppDataSource.getRepository(Provider).findOne({
              where: { accountId: recieverId },
              select: ["businessName"],
            })
            reciverName = prv?.businessName ?? ""
            break
          default:
            reciverName = "SYSTEM"
            break
        }
        if (!reciverName) continue
        arr.push({
          trxNumber: trx.trxNumber,
          trxDate: trx.createdAt,
          amount: trx.amount,
          pointType: trx.pointType,
          status: trx.status,
          transactionType: trx.transactionType,
          senderName,
          reciverName,
        })
      }
      // get other data
      const providers = await new ProviderRepository(AppDataSource).getAll()
      const customerCount = await new CustomerRepository(
        AppDataSource
      ).customerCount()
      const trxRepo = new TransactionRepository(AppDataSource)
      const trxCount = await trxRepo.trxCountTotal()
      const trxCountToday = await trxRepo.trxCountToday()

      res.status(200).json({
        wallets,
        trxCountToday,
        trxCount,
        customerCount,
        providerCount: providers.filter(
          (p) => p.status === ProviderStatus.ACTIVE
        ).length,
        applicantCount: providers.filter(
          (p) => p.status === ProviderStatus.PENDING
        ).length,
        trxs: arr,
      })
      next()
    } catch (error: any) {
      Log.error(`adminController.getAdminInformation: ${error.message}`)
      res.status(error.statusCode ?? 500).json({
        code: error.code,
        error: error.message,
      })
      next()
    }
  }

  public async getCustomerById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // const providerRepo = AppDataSource.getRepository(Provider)
      const customerId = Number(req.params.cid)
      const customerRepo = new CustomerRepository(AppDataSource)
      const customer = await customerRepo.getById(customerId, [
        "account",
        "account.wallets",
        "account.wallets.provider",
      ])
      if (!customer || !customer.account)
        throw new NotFoundError("لم يتم العثور على العميل")
      const trxs = customer.account.wallets.length
        ? await AppDataSource.getRepository(Transaction)
            .createQueryBuilder("trx")
            .where(
              "trx.fromWalletId IN(:...ids) OR trx.toWalletId IN(:...ids)",
              {
                ids: customer.account.wallets.map((w) => w.id),
              }
            )
            .orderBy("trx.createdAt", "DESC")
            .take(5)
            .getMany()
        : []
      res.status(200).json({ customer, trxs })
      next()
    } catch (error: any) {
      Log.error(`adminController.getCustomerById: ${error.message}`)
      res.status(error.statusCode ?? 500).json({
        code: error.code,
        error: error.message,
      })
      next()
    }
  }

  public async consume(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, providerId } = req.body
      const walletRepo = new WalletRepository(AppDataSource)
      const providerRepo = new ProviderRepository(AppDataSource)
      const fromWallet = await walletRepo.getSystemWallet(providerId)
      if (!fromWallet) throw new NotFoundError("لم يتم العثور على المرسل!")
      if (fromWallet.balance < amount)
        throw new BadInputError("ليس لديك رصيدٌ كافٍ لإتمام هذه العملية")
      const provider = await providerRepo.getById(providerId, [
        "account",
        "account.wallets",
      ])
      if (!provider?.account.wallets)
        throw new NotFoundError("لم يتم العثور على مزود الخدمة !")
      denyProviderInactive(provider)
      // do the thing
      // Logic for consuming points.
      let transactions: Transaction[] = []
      await AppDataSource.manager.transaction(async (em: EntityManager) => {
        const recs = fromWallet.records
        let total: number = 0
        let i: number = 0
        while (true) {
          const rec = recs[i]
          i++
          if (!rec.amount) continue // don't bother with empty recs
          if (rec.amount < amount - total) {
            const amt = rec.amount
            total += amt
            rec.amount = 0
            const recieveWallet = await em.findOne(Wallet, {
              where: {
                id: rec.originWalletId,
              },
            })
            if (!recieveWallet) continue
            recieveWallet.balance += amt
            fromWallet.totalConsume += amt
            await em.save(recieveWallet)
            await em.save(fromWallet)
            let trx = new Transaction()
            trx.amount = amt
            trx.transactionType = TransactionTypes.PURCHASE
            trx.fromWalletId = rec.targetWalletId
            trx.toWalletId = rec.originWalletId
            trx.status = TransactionStatus.CONFIRMED
            trx.trxNumber = generateNumber(9)
            trx = await em.save(trx)
            transactions.push(trx)
          } else {
            const recieveWallet = await em.findOne(Wallet, {
              where: { id: rec.originWalletId },
            })
            if (!recieveWallet) continue
            const amt = amount - total
            rec.amount -= amt
            total += amt
            recieveWallet.balance += amt
            fromWallet.totalConsume += amt
            await em.save(fromWallet)
            await em.save(recieveWallet)
            let trx = new Transaction()
            trx.amount = amt
            trx.transactionType = TransactionTypes.PURCHASE
            trx.fromWalletId = rec.targetWalletId
            trx.toWalletId = rec.originWalletId
            trx.status = TransactionStatus.CONFIRMED
            trx.trxNumber = generateNumber(9)
            trx = await em.save(trx)
            transactions.push(trx)
          }
          await em.save(rec)
          if (total >= amount) break
        }
      })
      res.status(200).json(transactions)
      next()
    } catch (err: any) {
      Log.error(`adminController.consume: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  public async createAffiliate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const repo = new AffiliateRepository(AppDataSource)
      const affiliate = await repo.create(req.body)
      res.status(200).json(affiliate)
      next()
    } catch (err: any) {
      Log.error(`adminController.createAffiliate: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  public async listAffiliates(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const repo = new AffiliateRepository(AppDataSource)
      const affiliate = await repo.getAll()
      res.status(200).json(affiliate)
      next()
    } catch (err: any) {
      Log.error(`adminController.listAffiliates: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  public async updateAffiliate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const repo = new AffiliateRepository(AppDataSource)
      const affiliate = await repo.update(req.body)
      res.status(200).json(affiliate)
      next()
    } catch (err: any) {
      Log.error(`adminController.listAffiliates: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  public async getSystemWalletList(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const walletRepo = new WalletRepository(AppDataSource)
      const wallets = await walletRepo.getSystemWallets(["provider"])
      res.status(200).json(wallets)
      next()
    } catch (err: any) {
      Log.error(`adminController.getSystemWalletList: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  public async createProviderCashier(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { name, phoneNumber, username, password } = req.body
      const providerRepo = new ProviderRepository(AppDataSource)
      const accountRepo = new AccountRepository(AppDataSource)
      const cahsierRepo = new CashierRepository(AppDataSource)
      const provider = await providerRepo.getById(Number(req.params.providerId))
      if (!provider) throw new NotFoundError("لم يتم العثور على مزود الخدمة")
      let account = new Account()
      account.username = username
      account.password = password
      account.accountNumber = await generateAccountNumber(accountRepo)
      account.type = UserTypes.CASHIER
      account = await accountRepo.create(account)
      const cashier = await cahsierRepo.create({
        name,
        phoneNumber,
        accountId: account.id,
        providerId: provider.id,
      })
      res.status(200).json({
        cashier,
      })
      next()
    } catch (error: any) {
      Log.error(`adminController.createProviderCashier ${error.message}`)
      res.status(error.statusCode ?? 500).json({
        error: error.message,
        code: error.code,
      })
      next()
    }
  }

  public async mapRecordsToBonuses(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { providerId } = req.body
      const repo = new WalletRepository(AppDataSource)
      const wallet = await repo.getByAccountIdAndProviderId(
        Number(req.user.userId),
        providerId
      )
      const ids = wallet.records.map((r) => r.originWalletId)
      const bonuses = (await AppDataSource.createQueryBuilder("wallet", "w")
        .where("id IN (:...ids)", {
          ids,
        })
        .getMany()) as Wallet[]
      const response = wallet.records.map((r) => {
        return {
          amount: r.amount,
          bonus: bonuses.find((b) => b.id === r.originWalletId)?.bonus,
        }
      })
      res.status(200).json(response)
      next()
    } catch (err: any) {
      Log.error(`adminController.mapRecordsToBonuses: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  public async deactivateWallet(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { walletId } = req.body
      const walletRepo = new WalletRepository(AppDataSource)
      const wallet = await walletRepo.getById(walletId)
      if (!wallet) throw new NotFoundError("لم يتم العثور على المحفظة")
      wallet.status = WalletStatus.INACTIVE
      // get all transactions related to this wallet
      res.status(200).json({
        wallet: await walletRepo.update(wallet),
      })
      next()
    } catch (err: any) {
      Log.error(`adminController.deactivateWallet: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  public async activateWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const { walletId } = req.body
      const walletRepo = new WalletRepository(AppDataSource)
      const wallet = await walletRepo.getById(walletId)
      if (!wallet) throw new NotFoundError("لم يتم العثور على المحفظة")
      wallet.status = WalletStatus.ACTIVE
      if (wallet.walletType === WalletTypes.PROVIDER && wallet.providerId) {
        const wallets = await walletRepo.getAllProviderWallets(
          wallet.providerId
        )
        // MERGE WALLETS #todo
        const walletsWithSameBonus = wallets.filter(
          (w) =>
            w.bonus === wallet.bonus && wallet.status === WalletStatus.ACTIVE
        )
        // wallet.walletType
      }
      // get all transactions related to this wallet
      res.status(200).json({
        wallet: await walletRepo.update(wallet),
      })
      next()
    } catch (err: any) {
      Log.error(`adminController.deactivateWallet: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  public async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountId, type } = req.body
      const accountRepo = new AccountRepository(AppDataSource)
      const account = await accountRepo.getById(accountId, [
        "wallets",
        "wallets.records",
        "wallets.incomingTransactions",
        "wallets.outgoingTransactions",
      ])
      if (!account) throw new NotFoundError("لم يتم العثور على الحساب")
      if (account.wallets.length) {
        // has points / trx / etc.., isable his account and all his wallest
        // step 1: deactivate all the wallets
        for (const w of account.wallets) {
          w.status = WalletStatus.INACTIVE
          await AppDataSource.manager.save(w)
        }
        // step 2: deactivate the account itself
        switch (account.type) {
          default:
          case UserTypes.CUSTOMER:
            const repo = new CustomerRepository(AppDataSource)
            const customer = await repo.getByAccountId(accountId)
            if (!customer) throw new NotFoundError("لم يتم العثور على المستهلك")
            customer.status = CustomerStatus.BANNED
            await repo.update(customer)
            break
          case UserTypes.PROVIDER:
            const providerRepo = new ProviderRepository(AppDataSource)
            const provider = await providerRepo.getByAccountId(accountId)
            if (!provider) throw new NotFoundError("لم يتم العثور على المزود")
            provider.status = ProviderStatus.BANNED
            await providerRepo.update(provider)
            break
        }
        res.status(200).json("تم تعطيل الحساب")
        return next()
      }
      // no points / trx / etc.., just delete the account
      switch (account.type) {
        default:
        case UserTypes.CUSTOMER:
          const repo = new CustomerRepository(AppDataSource)
          const customer = await repo.getByAccountId(accountId)
          if (!customer) throw new NotFoundError("لم يتم العثور على المستهلك")
          await repo.delete(customer.id)
          break
        case UserTypes.PROVIDER:
          const providerRepo = new ProviderRepository(AppDataSource)
          const provider = await providerRepo.getByAccountId(accountId)
          if (!provider) throw new NotFoundError("لم يتم العثور على المزود")
          await providerRepo.delete(provider.id)
          break
      }
      res.status(200).json("تم حذف الحساب")
    } catch (err: any) {
      Log.error(`adminController.deleteAccount: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  public async editWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const { bonus, fees, walletId } = req.body
      const repo = new WalletRepository(AppDataSource)
      const wallet = await repo.getById(walletId)
      if (!wallet) throw new NotFoundError("لم يتم العثور على المحفظة")
      if (bonus) wallet.bonus = bonus
      if (fees) wallet.fees = fees
      await repo.update(wallet)
      res.status(200).json(wallet)
      next()
    } catch (err: any) {
      Log.error(`adminController.editWallet: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  public async resetUserPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { password, accountId } = req.body
      const repo = new AccountRepository(AppDataSource)
      const account = await repo.getById(accountId)
      if (!account) throw new NotFoundError("لم يتم العثور على الحسابd")
      account.password = password
      await repo.update(account)
      res.status(200).json("تم تغيير كلمة المرور")
      next()
    } catch (err: any) {
      Log.error(`adminController.resetUserPassword: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }
}

export const generateWalletNumber = async (
  walletRepo: Repository<Wallet>
): Promise<number> => {
  const number = generateNumber(config.walletNumberLength)
  const wallet = await walletRepo.findOne({
    where: { walletNumber: number },
  })
  if (wallet) return generateWalletNumber(walletRepo)
  return number
}
