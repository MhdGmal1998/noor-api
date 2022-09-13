import { DataSource } from "typeorm"
import { generateWalletNumber } from "../controllers/adminController"
import { Wallet } from "../entities/Wallet"
import { NotFoundError } from "../errors/NotFoundError"
import { AppDataSource } from "../infrastructure/typeorm"
import { WalletTypes } from "../types"
import { AccountRepository } from "./AccountRepo"
import { BaseRepository } from "./BaseRepo"

export class WalletRepository extends BaseRepository<Wallet> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(Wallet)
    super(dbConnection, repo)
  }

  public async getCustomerWalletsByProviderId(
    providerId: number,
    relations?: string[]
  ): Promise<Wallet[]> {
    return this.repository.find({
      where: [
        { providerId, walletType: WalletTypes.CUSTOMER },
        { providerId, walletType: WalletTypes.SYSTEM },
      ],
      relations,
    })
  }

  public async getByAccountIdAndProviderId(
    accountId: number,
    providerId: number
  ): Promise<Wallet> {
    return this.repository.findOneOrFail({
      where: { accountId, providerId },
    })
  }

  public async getSystemWallets(relations?: string[]): Promise<Wallet[]> {
    return this.repository.find({
      where: { walletType: WalletTypes.SYSTEM },
      relations,
    })
  }

  public async getSystemWallet(providerId: number): Promise<Wallet | null> {
    return this.repository.findOne({
      where: { walletType: WalletTypes.SYSTEM, providerId },
    })
  }

  public async createSystemWallet(
    accountId: number,
    walletNumber: number,
    providerId: number
  ): Promise<Wallet> {
    const wallet = new Wallet()
    wallet.walletType = WalletTypes.SYSTEM
    wallet.accountId = accountId
    wallet.balance = 0
    wallet.walletNumber = walletNumber
    wallet.providerId = providerId
    return await this.create(wallet)
  }

  public async getOriginWallet(): Promise<Wallet | null> {
    return await this.repository.findOne({
      where: { walletType: WalletTypes.ORIGIN },
    })
  }

  public async createOriginWallet(
    accountId: number,
    walletNumber: number
  ): Promise<Wallet> {
    const wallet = new Wallet()
    wallet.walletType = WalletTypes.ORIGIN
    wallet.accountId = accountId
    wallet.balance = 0
    wallet.walletNumber = walletNumber
    wallet.accountId = accountId
    return await this.create(wallet)
  }

  public async getOrCreateSystemWalletOfProvider(
    providerId: number
  ): Promise<Wallet> {
    let systemWallet = await this.getSystemWallet(providerId)
    if (!systemWallet) {
      const systemAccount = await new AccountRepository(
        AppDataSource
      ).getSystemAccount()
      if (!systemAccount) throw new NotFoundError("No system wallet found")
      systemWallet = await this.createSystemWallet(
        systemAccount.id,
        await generateWalletNumber(AppDataSource.getRepository(Wallet)),
        providerId
      )
    }
    return systemWallet
  }

  public async getAllAccountWallets(
    walletId: number,
    relations?: string[]
  ): Promise<Wallet[]> {
    const wallet = await this.getById(walletId)
    if (!wallet) throw new NotFoundError("Wallet not found")
    return await this.repository.find({
      where: {
        accountId: wallet.accountId,
      },
      relations,
    })
  }

  public async getAllProviderWallets(providerId: number): Promise<Wallet[]> {
    return await this.repository.find({
      where: {
        providerId,
        walletType: WalletTypes.PROVIDER,
      },
    })
  }
}
