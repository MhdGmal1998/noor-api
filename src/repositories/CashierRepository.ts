import { DataSource } from "typeorm"
import { Cashier } from "../entities/Cashier"
import { BaseRepository } from "./BaseRepo"

export class CashierRepository extends BaseRepository<Cashier> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(Cashier)
    super(dbConnection, repo)
  }

  public async getAllByProviderId(providerId: number) {
    return await this.repository.find({ where: { providerId } })
  }

  // get cashier by account id
  public async getByAccountId(accountId: number, relations?: string[]) {
    return await this.repository.findOne({ where: { accountId }, relations })
  }
}
