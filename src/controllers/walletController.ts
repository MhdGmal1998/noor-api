import { Request, Response, NextFunction } from "express"
import { NotFoundError } from "../errors/NotFoundError"
import { AppDataSource } from "../infrastructure/typeorm"
import { denyNotWalletOwner } from "../lib/permissions"
import { TransactionRepository } from "../repositories/TransactionRepository"
import { WalletRepository } from "../repositories/WalletRepository"
import { Wallet } from "../entities/Wallet"
import Log from "../util/Log"

export class WalletController {
  // get a list of transactions related to a certain wallet(history)
  public async getWalletTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { walletId, take, skip } = req.body
      const walletRepo = new WalletRepository(AppDataSource)
      const trxRepo = new TransactionRepository(AppDataSource)
      const wallet = await walletRepo.getById(walletId)
      if (!wallet) throw new NotFoundError("Unknown wallet")
      denyNotWalletOwner(Number(req.user.userId), wallet)
      // get all transactions related to this wallet
      const transactions = await trxRepo.getAndCount(take, skip, [])
      res.status(200).json({
        transactions,
      })
      next()
    } catch (err: any) {
      Log.error(`walletController.getWalletTransactions: ${err.message}`)
      res.status(err.statusCode ?? 500).send(err.message)
    }
  }

  public getWallets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // const wallets = new WalletRepository(AppDataSource)
      // const data = await wallets.getOriginWallet()
      // console.log(data)
      // res.status(200).json({ data: data })
    }
    catch (error: any) {
      Log.error(`WalletController.getWallets ${error.message}`)
      res.status(500).json({ error: error.message })
      next()
    }
  }

  public myWallets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const wallets = await AppDataSource.getRepository(Wallet)
        .createQueryBuilder("w")
        .where("w.accountId = :accountId", { accountId: req.user.userId })
        .innerJoinAndSelect("w.provider", "p")
        .leftJoinAndSelect("w.records", "r")
        .leftJoinAndSelect("w.incomingTransactions", "incomingTrx")
        .leftJoinAndSelect("w.outgoingTransactions", "outgoingTrx")
        .select(["w", "p.businessName", "r", "incomingTrx", "outgoingTrx"])
        .getMany()
      res.status(200).json({ wallets })
    } catch (error: any) {
      Log.error(`WalletController.myWallets ${error.message}`)
      res.status(500).json({ error: error.message })
      next()
    }
  }
}
