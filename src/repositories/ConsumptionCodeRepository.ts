import { DataSource } from "typeorm"
import { ConsumptionCode } from "../entities/ConsumptionCode"
import { Provider } from "../entities/Provider"
import config from "../lib/config"
import generateNumber from "../util/generateNumber"
import { BaseRepository } from "./BaseRepo"

export class ConsumptionCodeRepository extends BaseRepository<ConsumptionCode> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(ConsumptionCode)
    super(dbConnection, repo)
  }

  public async generateCcode(
    amount: number,
    accountNumber: number,
    providerId: number
  ) {
    const code = generateNumber(config.cCodeNumberLength)
    return await this.create({ amount, accountNumber, code, providerId })
  }

  public async getCode(
    code: number,
    accountNumber: number,
    relations?: string[]
  ) {
    return await this.repository.findOne({
      where: { accountNumber, code },
      relations,
    })
  }

  // public async findCode(accountNumber: number, ccode: number) {
  // return await this.repository.findOne({
  // where: { accountNumber, code: ccode },
  // })
  // }
}
