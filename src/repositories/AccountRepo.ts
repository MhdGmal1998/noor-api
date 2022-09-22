import { DataSource } from "typeorm"
import { generateAccountNumber } from "../controllers/customerController"
import { Account } from "../entities/Account"
import { Wallet } from "../entities/Wallet"
import { UserTypes } from "../types"
import Log from "../util/Log"
import { BaseRepository } from "./BaseRepo"

export class AccountRepository extends BaseRepository<Account> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(Account)
    super(dbConnection, repo)
  }

  public async getByAccountNumber(
    accountNumber: number,
    relations?: string[]
  ): Promise<Account | undefined> {
    const result = await this.repository.findOne({
      where: { accountNumber },
      relations,
    })
    if (!result) return undefined
    return result
  }

  public async getByUsername(
    username: string,
    relations?: string[]
  ): Promise<Account | null> {
    const result = await this.repository.findOne({
      where: { username },
      relations,
    })
    return result
  }

  public async getWallets(accountId: number): Promise<Wallet[] | undefined> {
    const result = await this.getById(accountId, ["wallets"])
    if (!result) return undefined
    return result.wallets
  }

  public async getSystemAccount(): Promise<Account> {
    let account = await this.repository.findOne({
      where: { type: UserTypes.ADMIN },
    })
    if (!account) {
      Log.warning(
        "No system account was foundd, creating a new system account..."
      )
      account = await this.createSystemAccount()
    }
    return account
  }

  private async createSystemAccount(): Promise<Account> {
    const account = new Account()
    account.username = "system"
    account.password = "system"
    account.accountNumber = await generateAccountNumber(this)
    account.type = UserTypes.ADMIN
    return await this.repository.save(account)
  }
}
