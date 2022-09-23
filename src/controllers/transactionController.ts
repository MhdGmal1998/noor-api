import { Customer } from "../entities/Customer"
import { Provider } from "../entities/Provider"
import { Wallet } from "../entities/Wallet"
import { Transaction } from "../entities/Transaction"
import { BadInputError } from "../errors/BadInputError"
import { InternalError } from "../errors/InternalError"
import { NotAllowedError } from "../errors/NotAllowedError"
import { NotFoundError } from "../errors/NotFoundError"
import { AppDataSource } from "../infrastructure/typeorm"
import {
  CustomerStatus,
  PointTypes,
  ProviderStatus,
  TransactionStatus,
  TransactionTypes,
  UserTypes,
  WalletStatus,
  WalletTypes,
} from "../types"
import Log from "../util/Log"
import generateNumber from "../util/generateNumber"
import { WalletRepository } from "../repositories/WalletRepository"
import { Between, EntityManager } from "typeorm"
import {
  denyNotWalletOwner,
  denyProviderInactive,
  denyWalletNotOwnerOrCustomer,
} from "../lib/permissions"
import { AccountRepository } from "../repositories/AccountRepo"
import { generateWalletNumber } from "./adminController"
import { ProviderRepository } from "../repositories/ProviderRepository"
import { PointsRecord } from "../entities/CustomerPointsRecord"
import { PointRecordRepository } from "../repositories/PointRecordRepository"
import { Response, Request, NextFunction } from "express"
import { SystemConfigurationRepository } from "../repositories/SystemConfigurationRepo"
import constants from "../util/constants"

export class TransactionController {
  // get wallet owner info before transferring points
  public async getAccountInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const accountRepo = new AccountRepository(AppDataSource)
      const account = await accountRepo.getByAccountNumber(
        (req.params.acn)
      )
      if (!account) throw new NotFoundError("Account not found!")
      const giftingFees =
        Number(
          (
            await new SystemConfigurationRepository(AppDataSource).getByKey(
              "GIFTING_FEES"
            )
          )?.value
        ) ?? constants.DEFAULT_SYSTEM_CONF.GIFTING_FEES

      switch (account.type) {
        default:
        case UserTypes.CUSTOMER:
          const customer = await AppDataSource.getRepository(Customer).findOne({
            select: [
              "firstName",
              "lastName",
              "phoneNumber",
              "countryCode",
              "status",
            ],
            where: { accountId: account.id },
          })
          if (!customer) throw new InternalError("حدث خطأ ما...")
          if (customer.status !== CustomerStatus.ACTIVE)
            throw new NotAllowedError("الحساب غير مفعل")
          res.status(200).json({
            customer,
            giftingFees,
          })
          break
        case UserTypes.PROVIDER:
          const provider = await AppDataSource.getRepository(Provider).findOne({
            where: { accountId: account.id },
            select: [
              "ownerName",
              "businessName",
              "countryCode",
              "businessEmail",
              "status",
            ],
          })
          if (!provider)
            throw new NotFoundError("لم يتم العثور على مزود الخدمة")
          if (provider.status !== ProviderStatus.ACTIVE)
            throw new NotAllowedError("الحساب غير مفعل")
          res.status(200).json({
            provider,
            giftingFees,
          })
          break
      }
      next()
    } catch (err: any) {
      Log.error(`trxController.getWalletInfo: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  // Transfer points from a provider wallet to a customer wallet (receiving)
  // OR GIFTING
  public async transferPoints(req: Request, res: Response, next: NextFunction) {
    try {

      // the id of wallet, 
      // the wallet has typeWallet property which can be 
      // Sale or GIFT
      let { walletId, recepientAccountNumber, amount, flagTransfer } = req.body
      // Wallet Repo
      const walletRepo = new WalletRepository(AppDataSource)
      // The account Repo
      const accountRepo = new AccountRepository(AppDataSource)

      // Get the wallet 
      console.log("step 1  " + flagTransfer)

      const fromWallet = await walletRepo.getById(walletId)
      console.log("after get wallet 1  " + flagTransfer)

      const configRepo = new SystemConfigurationRepository(AppDataSource)

      console.log("after get systemConfig " + flagTransfer)

      if (!fromWallet) throw new NotFoundError("Sender not found!")
      if (fromWallet.status !== WalletStatus.ACTIVE)
        throw new NotAllowedError("هذه المحفظة معطّلة.")

      console.log("after check wallet" + flagTransfer)

      denyNotWalletOwner(req.user.userId, fromWallet)


      // get the recepient with his wallets
      const recepient = await accountRepo.getByAccountNumber(
        recepientAccountNumber,
        ["wallets"]
      )

      console.log("after get recepient " + flagTransfer)

      if (!recepient)
        throw new NotFoundError("Recepient not found!")

      if (recepient.id === Number(req.user.userId))
        throw new NotAllowedError("لا يمكن تحويل الرصيد إلى نفسك")
      if (recepient.type === UserTypes.PROVIDER)
        throw new NotAllowedError("لا يمكن تحويل الرصيد إلى مزود الخدمة")

      console.log("after check the recepeint id" + flagTransfer)
      let type = TransactionTypes.TRANSFER
      // provider transferring points
      // incures granting fees
      let fees = fromWallet.fees ?? 0

      console.log("after get fees " + flagTransfer + " the fees " + fees)

      // let subtotal = Number((amount + (amount * fees) / 100).toFixed(2))
      let subtotal = 0
      if (flagTransfer == "SALE")
        subtotal = Number((amount + (amount * fees) / 100).toFixed(2))
      else if (flagTransfer == "GIFT")
        subtotal = Number(((amount * fees) / 100).toFixed(2))

      console.log("after cal subtotal  " + flagTransfer + " subtotal " + subtotal)

      if (fromWallet.bonus)
        subtotal += Number(((amount * fromWallet.bonus) / 100).toFixed(2))

      console.log("after cal bonus  " + flagTransfer + " subtotal " + subtotal)

      if (fromWallet.walletType === WalletTypes.CUSTOMER) {
        const giftingFees = await configRepo.getByKey("GIFTING_FEES")
        const MAXIMUM_DAILY_TRANSACTIONS =
          Number(
            await configRepo.getValueByKey("MAXIMUM_DAILY_TRANSACTIONS")
          ) ??
          constants.DEFAULT_SYSTEM_CONF.MAXIMUM_DAILY_TRANSACTIONS
        console.log("after get giftingFees  " + flagTransfer + " giftingFees " + giftingFees)

        
        const MAXIMUM_DAILY_TRANSACTIONS_AMOUNT =
          (await configRepo.getValueByKey("MAXIMUM_DAILY_OUTGOING_POINTS")) ??
          constants.DEFAULT_SYSTEM_CONF.MAXIMUM_DAILY_OUTGOING_POINTS


        if (giftingFees)
          fees = Number(giftingFees.value)

        else
          fees = constants.DEFAULT_SYSTEM_CONF.GIFTING_FEES

        subtotal = Number((amount + (amount * fees) / 100).toFixed(2))
        // check maximums
        const wallets = await walletRepo.getAllAccountWallets(fromWallet.id, [
          "outgoingTransactions",
        ])

        const trxsToday: Transaction[] = []
        wallets.map((wallet) => {
          wallet.outgoingTransactions
            .filter((t) => t.createdAt.getDate() === new Date().getDate())
            .map((t) => trxsToday.push(t))
        })
        Log.debug("TRXS TODAY:")
        console.log(trxsToday)
        if (trxsToday.length >= MAXIMUM_DAILY_TRANSACTIONS)
          return res
            .status(403)
            .json("لقد تخطّيت الحد الأقصى لعدد المعاملات اليومية.")
        const trxAmount = Math.round(
          trxsToday.reduce((acc, trx) => acc + trx.amount, 0)
        )
        if (trxAmount + subtotal >= MAXIMUM_DAILY_TRANSACTIONS_AMOUNT)
          return res
            .status(403)
            .json("لقد تخطّيت الحد الأقصى لمبلغ المعاملات اليومية.")
      }

      if (fromWallet.balance < subtotal)
        throw new BadInputError(
          `ليس لديك رصيدٌ كافٍ لإتمام هذه العملية ${subtotal}`
        )
      // find the target wallet
      let wallet = recepient.wallets.find(
        (w) => w.providerId === fromWallet.providerId
      )
      if (!wallet) {
        // create a new wallet for the recepient
        wallet = new Wallet()
        wallet.providerId = fromWallet.providerId
        wallet.balance = 0
        wallet.walletType = WalletTypes.CUSTOMER
        wallet.accountId = recepient.id
        wallet.pointType = fromWallet.pointType
        wallet.walletNumber = await generateWalletNumber(
          AppDataSource.getRepository(Wallet)
        )
        wallet = await walletRepo.create(wallet)
      }
      // if C2C
      if (
        fromWallet.walletType === WalletTypes.CUSTOMER ||
        fromWallet.walletType === WalletTypes.SYSTEM
      ) {
        await transferGiftingPoints(
          fromWallet,
          wallet!,
          amount,
          fees,
          fromWallet.walletType
        )
        type = TransactionTypes.GIFT
      } else
        await AppDataSource.manager.transaction(async (em: EntityManager) => {
          const total = fromWallet.bonus
            ? amount + Number(((amount * fromWallet.bonus) / 100).toFixed(2))
            : amount
          // take system cut
          // transfer
          let record = await em.findOne(PointsRecord, {
            where: {
              originWalletId: fromWallet.id,
              targetWalletId: wallet!.id,
            },
          })
          if (record) record.amount += total
          else
            record = em.create(PointsRecord, {
              originWalletId: fromWallet.id,
              targetWalletId: wallet!.id,
              amount: total,
            })
          Log.debug("TWID")
          await em.save(record)
          wallet!.records = wallet?.records
            ? [...wallet!.records, record]
            : [record]
          await em.save(wallet)
        })
      // #TODO should we check for wallet status first?
      const trx = await makeTransaction(
        fromWallet,
        wallet,
        type,
        amount,
        fromWallet.fees ?? 0
      )
      // update provider account
      // #TODO I'm not supposed to be here
      res.status(201).json(trx)
      return next()
    } catch (err: any) {
      Log.error(`trxController.transferPoints: ${err.message}`)
      console.log(err)
      return res.status(err.statusCode ?? 500).send(err.message)
    }
  }



  public async consumePoint(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, walletId, cashierId } = req.body
      const walletRepo = new WalletRepository(AppDataSource)
      const providerRepo = new ProviderRepository(AppDataSource)
      const fromWallet = await walletRepo.getById(walletId)
      if (!fromWallet) throw new NotFoundError("لم يتم العثور على المرسل!")
      denyWalletNotOwnerOrCustomer(req.user.userId, fromWallet)
      if (fromWallet.balance < amount)
        throw new BadInputError("ليس لديك رصيدٌ كافٍ لإتمام هذه العملية")
      if (!fromWallet.providerId)
        throw new NotAllowedError("لا يمكنك استخدام هذه المحفظة")
      const provider = await providerRepo.getById(fromWallet.providerId, [
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
            if (cashierId) trx.cashierId = cashierId
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
      Log.error(`trxController.consumePoints: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  public async getTrxFromDates(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let {
        fromDate,
        take,
        skip,
        toDate,
        incomingOnly,
        outgoingOnly,
        accountId,
      } = req.body
      if (accountId) {
        if (req.user.type !== UserTypes.ADMIN)
          throw new NotAllowedError(
            "You are not allowed to perform this operation"
          )
        take = 50
      } else accountId = Number(req.user.userId)
      const accountRepo = new AccountRepository(AppDataSource)
      const incomingWhere = {
        createdAt: Between(fromDate, toDate),
        toWallet: {
          accountId,
        },
      }
      const outgoingWhere = {
        createdAt: Between(fromDate, toDate),
        fromWallet: {
          accountId,
        },
      }
      const where = incomingOnly
        ? incomingWhere
        : outgoingOnly
          ? outgoingWhere
          : [incomingWhere, outgoingWhere]

      const trxs = await AppDataSource.getRepository(Transaction).find({
        where,
        take,
        skip,
        loadEagerRelations: false,
        order: {
          createdAt: "DESC",
        },
        relations: ["fromWallet", "toWallet"],
        select: {
          id: true,
          createdAt: true,
          trxNumber: true,
          amount: true,
          pointType: true,
          transactionType: true,
          status: true,
          fromWallet: {
            accountId: true,
          },
          toWallet: {
            accountId: true,
          },
        },
      })
      // for each transaction, get the other person #TODO clean me up please for god's sake man
      const arr = []
      for (const trx of trxs) {
        const trxType =
          trx.fromWallet.accountId === accountId ? "outgoing" : "incoming"
        //id of the other person
        const id =
          trxType === "outgoing"
            ? trx.toWallet.accountId
            : trx.fromWallet.accountId
        const otherPerson = await accountRepo.getById(id)
        if (!otherPerson) continue
        let name: string = ""
        switch (otherPerson.type) {
          case UserTypes.CUSTOMER:
            const cst = await AppDataSource.getTreeRepository(Customer).findOne(
              {
                where: {
                  accountId: otherPerson.id,
                },
                select: ["firstName", "lastName"],
              }
            )
            if (!cst) continue
            name = cst.firstName + " " + cst.lastName
            break
          case UserTypes.PROVIDER:
            const prv = await AppDataSource.getTreeRepository(Provider).findOne(
              { where: { accountId: otherPerson.id }, select: ["businessName"] }
            )
            name = prv?.businessName ?? ""
            break
          default:
          case UserTypes.ADMIN:
            name = "SYSTEM"
            break
        }
        if (!name) continue
        arr.push({
          trxNumber: trx.trxNumber,
          trxDate: trx.createdAt,
          trxType,
          amount: trx.amount,
          pointType: trx.pointType,
          status: trx.status,
          transactionType: trx.transactionType,
          name,
        })
      }
      res.status(200).json(arr)
      next()
    } catch (err: any) {
      Log.error(`trxController.getTrxFromDates: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  public async getLatestTrx(req: Request, res: Response, next: NextFunction) {
    try {
      let { take, skip, incomingOnly, outgoingOnly, accountId } = req.body
      if (accountId) {
        if (req.user.type !== UserTypes.ADMIN)
          throw new NotAllowedError(
            "You are not allowed to perform this operation"
          )
      } else accountId = Number(req.user.userId)
      const incomingWhere = {
        toWallet: {
          accountId,
        },
      }
      const outgoingWhere = {
        fromWallet: {
          accountId,
        },
      }
      const where = incomingOnly
        ? incomingWhere
        : outgoingOnly
          ? outgoingWhere
          : [incomingWhere, outgoingWhere]
      const accountRepo = new AccountRepository(AppDataSource)
      const trxs = await AppDataSource.getRepository(Transaction).find({
        take,
        where,
        skip,
        loadEagerRelations: false,
        order: {
          createdAt: "DESC",
        },
        relations: ["fromWallet", "toWallet"],
        select: {
          id: true,
          createdAt: true,
          trxNumber: true,
          amount: true,
          pointType: true,
          transactionType: true,
          status: true,
          fromWallet: {
            accountId: true,
          },
          toWallet: {
            accountId: true,
          },
        },
      })
      // for each transaction, get the other person #TODO clean me up please for god's sake man
      const arr = []
      for (const trx of trxs) {
        const trxType =
          trx.fromWallet.accountId === accountId ? "outgoing" : "incoming"
        //id of the other person
        const id =
          trxType === "outgoing"
            ? trx.toWallet.accountId
            : trx.fromWallet.accountId
        const otherPerson = await accountRepo.getById(id)
        if (!otherPerson) continue
        let name: string = ""
        switch (otherPerson.type) {
          case UserTypes.CUSTOMER:
            const cst = await AppDataSource.getTreeRepository(Customer).findOne(
              {
                where: {
                  accountId: otherPerson.id,
                },
                select: ["firstName", "lastName"],
              }
            )
            if (!cst) continue
            name = cst.firstName + " " + cst.lastName
            break
          case UserTypes.PROVIDER:
            const prv = await AppDataSource.getTreeRepository(Provider).findOne(
              { where: { accountId: otherPerson.id }, select: ["businessName"] }
            )
            name = prv?.businessName ?? ""
            break
          default:
          case UserTypes.ADMIN:
            name = "SYSTEM"
            break
        }
        if (!name) continue
        arr.push({
          trxNumber: trx.trxNumber,
          trxDate: trx.createdAt,
          trxType,
          amount: trx.amount,
          pointType: trx.pointType,
          status: trx.status,
          transactionType: trx.transactionType,
          name,
        })
      }
      res.status(200).json(arr)
      next()
    } catch (err: any) {
      Log.error(`trxController.getLatestTrx: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  public async getTrxByTrxNumber(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { accountId, trxNumber } = req.body
      const accountRepo = new AccountRepository(AppDataSource)
      const acc = await accountRepo.getById(accountId, ["wallets"])
      if (!acc) throw new NotFoundError("Account not found")
      const wallets = acc.wallets.map((w) => w.id)
      const trx = await AppDataSource.getRepository(Transaction)
        .createQueryBuilder("t")
        .where(
          "t.trxNumber = :trxNumber AND (t.fromWalletId IN (:wallets) OR t.toWalletId IN (:wallets))",
          { trxNumber, wallets }
        )
        .getOne()
      if (!trx) return res.status(404).send("Transaction not found")
      // find the name of the other person
      // #TODO
      return res.status(200).json({
        trxNumber: trx.trxNumber,
        trxDate: trx.createdAt,
        trxType: wallets.includes(trx.fromWalletId) ? "outgoing" : "incoming",
        amount: trx.amount,
        type: trx.transactionType,
        status: trx.status,
        pointType: trx.pointType,
      })
    } catch (error: any) {
      Log.error(`trxController.getTrxByTrXNum: ${error.message}`)
      res
        .status(error.statusCode ?? 500)
        .json({ code: error.code, error: error.message })
      return next()
    }
  }

  // public async getLatestTrx(req: Request, res: Response, next: NextFunction) {
  // try {
  // const { take, skip, incomingOnly, outgoingOnly } = req.body
  // const accountId = Number(req.user.userId)
  // const trx = await AppDataSource.getRepository(Transaction).find({
  //
  // })
  // } catch (err: any) {
  // Log.error(`trxController.grantPoints: ${err.message}`)
  // res.status(err.statusCode ?? 500).send(err.message)
  // }
  // }

  // public async(req: Request, res: Response, next: NextFunction) {
  // try {
  // } catch (err: any) {
  // Log.error(`trxController.grantPoints: ${err.message}`)
  // res.status(err.statusCode ?? 500).send(err.message)
  // }
  // }

  // confirm trnascation#TODO
  // public async confirmTransaction(
  // req: Request,
  // res: Response,
  // next: NextFunction
  // ) {
  // try {
  // } catch (err: any) {
  // Log.error(`trxController.grantPoints: ${err.message}`)
  // res.status(err.statusCode ?? 500).send(err.message)
  // }
  // }
  //

  // public async getWalletInfo(req: Request, res: Response, next: NextFunction) {
  // try {
  // } catch (err: any) {
  // Log.error(`trxController.grantPoints: ${err.message}`)
  // res.status(err.statusCode ?? 500).send(err.message)
  // }
  // }
}

export const makeTransaction = async (
  from: Wallet,
  to: Wallet,
  type: TransactionTypes,
  amount: number,
  fees: number
): Promise<Transaction> => {
  const walletRepo = new WalletRepository(AppDataSource)
  const recordRepo = new PointRecordRepository(AppDataSource)
  return await AppDataSource.manager.transaction(async (em: EntityManager) => {
    // take system cut
    if (fees > 0 && from.walletType !== WalletTypes.SYSTEM) {
      // check if there's a system wallet for this provider:
      const cutAmount = Number(((amount * fees) / 100).toFixed(2))
      if (cutAmount > 0) {
        const systemWallet = await walletRepo.getOrCreateSystemWalletOfProvider(
          from.providerId ?? 0
        )
        // update system wallet balance
        const record = await recordRepo.updateWalletBalance(
          systemWallet.id,
          from.id,
          cutAmount
        )
        systemWallet.records = systemWallet.records
          ? [...systemWallet.records, record]
          : [record]
        // update provider balance
        from.balance -= cutAmount
        from.totalSold += cutAmount
        await em.save(systemWallet)
        const trx = new Transaction()
        trx.amount = cutAmount
        trx.fromWalletId = from.id
        trx.toWalletId = systemWallet.id
        trx.pointType = PointTypes.WHITE
        trx.transactionType = TransactionTypes.FEES
        trx.trxNumber = generateNumber(9)
        trx.status = TransactionStatus.CONFIRMED
        await em.save(trx)
      }
    }
    // transfer points
    const trx = new Transaction()
    if (from.bonus && type === TransactionTypes.TRANSFER)
      amount += Number(((amount * from.bonus) / 100).toFixed(2))
    if (from.balance < amount) throw new BadInputError("ليس لديك رصيدٌ كافي")
    trx.amount = amount
    trx.fromWalletId = from.id
    trx.toWalletId = to.id
    trx.pointType = PointTypes.WHITE
    trx.transactionType = type
    trx.trxNumber = generateNumber(9)
    await em.save(trx)
    // update wallets
    from.balance -= amount
    from.totalTrx += 1
    to.totalTrx += 1
    if (from.walletType === WalletTypes.PROVIDER) from.totalSold += amount
    if (type === TransactionTypes.PURCHASE) from.totalConsume += amount
    await em.save(from)
    await em.save(to)
    trx.status = TransactionStatus.CONFIRMED
    await em.save(trx)
    return trx
  })
}

export const transferGiftingPoints = async (
  from: Wallet,
  to: Wallet,
  amount: number,
  fees: number,
  type: WalletTypes
): Promise<void> => {
  Log.debug("TRASNFER BEGINS")
  // only use this function when you want to transfer points between wallets from customer to customer or from provider to customer
  const walletRepo = new WalletRepository(AppDataSource)
  const recordRepo = new PointRecordRepository(AppDataSource)
  const systemWallet = await walletRepo.getOrCreateSystemWalletOfProvider(
    from.providerId ?? 0
  )
  // get the records of the sender
  const senderRecs = from.records
  Log.debug("TO WALLET: ")
  console.log(to)
  console.log(senderRecs)
  let totalTransferred: number = 0
  await AppDataSource.manager.transaction(async (em: EntityManager) => {
    Log.debug("TRANSFERING THE AMOUNT")
    for (const rec of senderRecs) {
      if (totalTransferred >= amount) break
      const amt = Math.min(rec.amount, amount - totalTransferred)
      Log.debug(`Transferred ${amt} points`)
      rec.amount -= amt
      rec.amount = Number(rec.amount.toFixed(2))
      totalTransferred += amt
      // add recs to reciever
      await recordRepo.updateWalletBalance(to.id, rec.originWalletId, amt)
      Log.debug("UPSERT CONPETLTE")
      // update recs from sender
      await em.save(rec)
      Log.debug(`RECORD SAVED`)
    }
    if (type === WalletTypes.SYSTEM) return
    // take system cut
    Log.debug("TRANSFER COMPLETE . Taking system cut...")
    console.log(senderRecs)
    totalTransferred = 0
    Log.debug(`${systemWallet.id}, ${fees}`)
    if (systemWallet && fees) {
      const cutAmount = Number(((amount * fees) / 100).toFixed(2))
      Log.debug(`Cut amount: ${cutAmount}`)
      if (cutAmount > 0) {
        // update system wallet balance
        Log.debug("BEGIN SECON LOOP")
        for (const rec of senderRecs) {
          Log.debug(`tot: ${totalTransferred}`)
          if (totalTransferred >= cutAmount) break
          const amt = Math.min(rec.amount, cutAmount - totalTransferred)
          rec.amount -= amt
          totalTransferred += amt
          rec.amount = Number(rec.amount.toFixed(2))
          // add recs to reciever
          await recordRepo.updateWalletBalance(
            systemWallet.id,
            rec.originWalletId,
            amt
          )
          // await em.upsert(
          // PointsRecord,
          // {
          // originWalletId: rec.originWalletId,
          // targetWalletId: systemWallet.id,
          // amount: amt,
          // },
          // { conflictPaths: ["targetWalletId", "originWalletId"] }
          // )
          Log.debug("UPSERT CONPETLTE")
          // update recs from sender
          await em.save(rec)
          Log.debug(`RECORD SAVED`)
        }
        Log.debug("SYSTEM TRANFSER COMPLETE")
        console.log(senderRecs)
        const trx = new Transaction()
        trx.amount = cutAmount
        trx.fromWalletId = from.id
        trx.toWalletId = systemWallet.id
        trx.pointType = PointTypes.WHITE
        trx.transactionType = TransactionTypes.FEES
        trx.trxNumber = generateNumber(9)
        trx.status = TransactionStatus.CONFIRMED
        await em.save(trx)
        Log.debug("TRX: ")
        console.log(trx)
      }
    }
  })
}
