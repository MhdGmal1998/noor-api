import { NextFunction, Request, Response } from "express"
import { EntityManager, Repository } from "typeorm"
import { Account } from "../entities/Account"
import { Affiliate } from "../entities/Affiliate"
import { Customer } from "../entities/Customer"
import { Provider } from "../entities/Provider"
import { Review } from "../entities/Review"
import { NotAllowedError } from "../errors/NotAllowedError"
import { NotAuthenticatedError } from "../errors/NotAuthenticated"
import { NotFoundError } from "../errors/NotFoundError"
import { AppDataSource } from "../infrastructure/typeorm"
import { AccountRepository } from "../repositories/AccountRepo"
import { AffiliateRepository } from "../repositories/AffiliateRepo"
import { CashierRepository } from "../repositories/CashierRepository"
import { ProviderRepository } from "../repositories/ProviderRepository"
import { ReviewRepository } from "../repositories/ReviewRepository"
import { WalletRepository } from "../repositories/WalletRepository"
import { ProviderStatus, UserTypes, WalletTypes } from "../types"
import Log from "../util/Log"
import { generateAccountNumber } from "./customerController"

export class ProviderController {
  public async registerNewProvider(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {

      console.log(req.body)
      const provider = await AppDataSource.manager.transaction(
        async (em: EntityManager) => {
          const p = new Provider()
          Object.assign(p, req.body)
          // create account for provider
          if (req.body.affiliateCode) {
            const affiliate = await em.findOne(Affiliate, {
              where: { code: req.body.affiliateCode },
            })
            if (affiliate && affiliate.status === "ACTIVE")
              p.affiliate = affiliate
          }
          const account = new Account()
          account.username = req.body.username
          account.password = req.body.password
          account.accountNumber = await generateAccountNumber(
            new AccountRepository(AppDataSource)
          )
          account.type = UserTypes.PROVIDER
          await em.save(account)
          p.accountId = account.id
          p.account = account
          return await em.save(p)
        }
      )
      res.status(201).json({
        message: "Provider created successfully",
        createdAt: provider.createdAt,
        provider,
        accountNumber: provider.account.accountNumber,
      })
      return next()
    } catch (error: any) {
      Log.error(`ProviderController.registerNewProvider ${error.message}`)
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .json({ message: "رقم الهاتف موجود مسبقا" })
      }
      res
        .status(error.statusCode ?? 500)
        .json({ error: error.message, code: error.code })
      next()
    }
  }

  public async getActiveProviders(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const providerRepo = AppDataSource.getRepository(Provider)
      const providers = await providerRepo.find({
        where: { status: ProviderStatus.ACTIVE, isSystem: false },
        relations: ["wallets", "businessCategory"],
      })
      const response = providers.map(
        ({
          businessName,
          businessAddress,
          businessEmail,
          businessPhoneNumber,
          countryCode,
          businessCategory,
          wallets,
        }) => {
          return {
            businessName,
            businessPhoneNumber,
            businessEmail,
            businessAddress,
            countryCode,
            category: businessCategory?.nameAr ?? "",
            customerCount: wallets.filter(
              (w) => w.walletType === WalletTypes.CUSTOMER
            ).length,
            bonuses: wallets
              .filter((w) => w.walletType === WalletTypes.PROVIDER)
              .map((w) => w.bonus),
          }
        }
      )
      res.status(200).json(response)
      next()
    } catch (error: any) {
      Log.error(`ProviderController.getActiveProviders ${error.message}`)
      res
        .status(error.statusCode ?? 500)
        .json({ error: error.message, code: error.code })
      next()
    }
  }

  public async updateCashierStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { cashierId, status } = req.body
      const providerRepo = new ProviderRepository(AppDataSource)
      const cahsierRepo = new CashierRepository(AppDataSource)
      const provider = await providerRepo.getByAccountId(
        Number(req.user.userId)
      )
      if (!provider) throw new NotFoundError("لم يتم العثور على مزود الخدمة")
      const cashier = await cahsierRepo.getById(cashierId)
      if (!cashier) throw new NotFoundError("لم يتم العثور على المصروف")
      cashier.status = status
      await cahsierRepo.update(cashier)
      res.status(200).json({ message: "تم تعطيل المصروف بنجاح" })
      next()
    } catch (error: any) {
      Log.error(`ProviderController.addCashier ${error.message}`)
      res
        .status(error.statusCode ?? 500)
        .json({ error: error.message, code: error.code })
      next()
    }
  }

  public async addCashier(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, phoneNumber, username, password } = req.body
      const providerRepo = new ProviderRepository(AppDataSource)
      const accountRepo = new AccountRepository(AppDataSource)
      const cahsierRepo = new CashierRepository(AppDataSource)
      const provider = await providerRepo.getByAccountId(
        Number(req.user.userId)
      )
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
      Log.error(`ProviderController.addCashier ${error.message}`)
      res
        .status(error.statusCode ?? 500)
        .json({ error: error.message, code: error.code })
      next()
    }
  }

  public async getCashierList(req: Request, res: Response, next: NextFunction) {
    try {
      const cashierRepo = new CashierRepository(AppDataSource)
      const providerRepo = new ProviderRepository(AppDataSource)
      const provider = await providerRepo.getByAccountId(
        Number(req.user.userId)
      )
      if (!provider) throw new NotFoundError("لم يتم العثور على مزود الخدمة")
      const cashiers = await cashierRepo.getAllByProviderId(provider.id)
      res.status(200).json(cashiers)
      next()
    } catch (error: any) {
      Log.error(`ProviderController.getCashierList ${error.message}`)
      res
        .status(error.statusCode ?? 500)
        .json({ error: error.message, code: error.code })
      next()
    }
  }

  public async getCashierByProviderId(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const cashierRepo = new CashierRepository(AppDataSource)
      const providerRepo = new ProviderRepository(AppDataSource)
      const cashiers = await cashierRepo.getAllByProviderId(
        Number(req.params.providerId)
      )
      res.status(200).json(cashiers)
      next()
    } catch (error: any) {
      Log.error(`ProviderController.getCashierByProviderId ${error.message}`)
      res
        .status(error.statusCode ?? 500)
        .json({ error: error.message, code: error.code })
      next()
    }
  }

  public async getCustomerList(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const providerRepo = new ProviderRepository(AppDataSource)
      const provider = await providerRepo.getByAccountId(
        Number(req.user.userId)
      )
      if (!provider) throw new NotFoundError("لم يتم العثور على مزود الخدمة")
      const accounts = await AppDataSource.getRepository(Account)
        .createQueryBuilder("a")
        .leftJoinAndSelect("a.wallets", "w")
        .leftJoinAndSelect("w.records", "r")
        .where("w.providerId = :providerId AND w.walletType = :walletType", {
          providerId: provider.id,
          walletType: WalletTypes.CUSTOMER,
        })
        .select(["a.id", "a.accountNumber", "r.amount", "w.totalConsume"])
        .getMany()
      if (!accounts.length) return res.status(200).json([])
      const customers = await AppDataSource.getRepository(Customer)
        .createQueryBuilder("c")
        .leftJoinAndSelect("c.account", "a")
        .where("c.accountId IN (:...accounts)", {
          accounts: accounts.map((a) => a.id),
        })
        .select([
          "c.id",
          "c.firstName",
          "c.lastName",
          "c.phoneNumber",
          "c.accountId",
        ])
        .getMany()
      res.status(200).json(
        customers.map((c: Customer) => {
          const acc = accounts.find((a: Account) => a.id === c.accountId)
          if (!acc) return c
          const { balance, totalConsume } = acc.wallets[0]
          return {
            ...c,
            balance,
            totalConsume,
            accountNumber: acc.accountNumber,
          }
        })
      )
    } catch (error: any) {
      Log.error(`ProviderController.getCustomerList ${error.message}`)
      res
        .status(error.statusCode ?? 500)
        .json({ error: error.message, code: error.code })
      next()
    }
  }

  public async getAffiliate(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new AffiliateRepository(AppDataSource)
      const affiliate = await repo.getAffiliateByCode(req.params.affiliateCode)
      if (!affiliate) throw new NotFoundError("كود المسوق غير صحيح !")
      res.status(200).json(affiliate)
    } catch (error: any) {
      Log.error(`ProviderController.getAffiliate ${error.message}`)
      res
        .status(error.statusCode ?? 500)
        .json({ error: error.message, code: error.code })
      next()
    }
  }

  public async getProviderInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const providerRepo = new ProviderRepository(AppDataSource)
      const walletRepo = new WalletRepository(AppDataSource)
      const provider = await providerRepo.getByAccountId(
        Number(req.user.userId),
        ["account", "account.wallets"]
      )
      if (!provider) throw new NotFoundError("لم يتم العثور على مزود الخدمة")
      const wallets = await walletRepo.getCustomerWalletsByProviderId(
        provider.id
      )
      res.status(200).json({
        accountNumber: provider.account.accountNumber,
        customerCount: wallets.length,
        totalSold: provider.account.wallets
          .filter((w) => w.walletType === WalletTypes.PROVIDER)
          .reduce((acc, curr) => acc + curr.totalSold, 0),
        totalCustomerCredit: wallets.reduce(
          (total, curr) => total + curr.balance,
          0
        ),
        currentBalance: provider.account.wallets.reduce(
          (total, curr) => total + curr.balance,
          0
        ),
      })
      next()
    } catch (error: any) {
      Log.error(`ProviderController.getProviderInfo ${error.message}`)
      res
        .status(error.statusCode ?? 500)
        .json({ error: error.message, code: error.code })
      next()
    }
  }

  public async rateProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const providerRepo = new ProviderRepository(AppDataSource)
      const { customerId } = req.user
      const { providerId, comment, rating } = req.body
      if (!customerId) throw new NotFoundError("لم يتم العثور على حساب العميل")
      const provider = await providerRepo.getById(providerId)
      if (!provider) throw new NotFoundError("لم يتم العثور على مزود الخدمة")
      const repo = new ReviewRepository(AppDataSource)
      const review = await repo.rate(
        providerId,
        Number(customerId),
        rating,
        comment
      )
      if (review) res.status(201).json(review)
      else res.status(400).json("لقد قمت بتقييم مزود الخدمة هذا بالفعل.")
      next()
    } catch (error: any) {
      Log.error(`ProviderController.rateProvider ${error.message}`)
      res
        .status(error.statusCode ?? 500)
        .json({ error: error.message, code: error.code })
      next()
    }
  }

  public async editProviderProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const providerRepo = new ProviderRepository(AppDataSource)
      const { providerId } = req.user
      if (!providerId) throw new NotAllowedError("لم يتم التحقق من الحساب")
      let provider = await providerRepo.getById(Number(providerId))
      if (!provider) throw new NotFoundError("لم يتم العثور على مزود الخدمة")
      Object.assign(provider, req.body)
      provider = await providerRepo.update(provider)
      res.status(200).json(provider)
      next()
    } catch (error: any) {
      Log.error(`ProviderController.editProviderProfile ${error.message}`)
      res
        .status(error.statusCode ?? 500)
        .json({ error: error.message, code: error.code })
      next()
    }
  }
}
