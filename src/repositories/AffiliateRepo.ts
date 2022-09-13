import { DataSource } from "typeorm"
import { Affiliate } from "../entities/Affiliate"
import { Wallet } from "../entities/Wallet"
import { WalletTypes } from "../types"
import { BaseRepository } from "./BaseRepo"

export class AffiliateRepository extends BaseRepository<Affiliate> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(Affiliate)
    super(dbConnection, repo)
  }
  public async getAffiliateByCode(code: string): Promise<Affiliate | null> {
    return this.repository.findOne({ where: { code } })
  }
}
