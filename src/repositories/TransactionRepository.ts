import { Between, DataSource } from "typeorm"
import { Transaction } from "../entities/Transaction"
import { BaseRepository } from "./BaseRepo"

export class TransactionRepository extends BaseRepository<Transaction> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(Transaction)
    super(dbConnection, repo)
  }

  public async getAndCount(
    take: number = 10,
    skip: number = 0,
    relations: string[]
  ): Promise<{ values: Transaction[]; count: number }> {
    const [result, total] = await this.repository.findAndCount({
      relations,
      take,
      skip,
      order: {
        id: "DESC",
      },
    })
    return {
      values: result,
      count: total,
    }
  }

  public async trxCountToday(): Promise<number> {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const count = await this.repository.count({
      where: {
        createdAt: Between(yesterday, today),
      },
    })
    return count
  }

  public async trxCountTotal(): Promise<number> {
    const count = await this.repository.count()
    return count
  }

  public async getByTrXNumber(trxNumber: number): Promise<Transaction | null> {
    const trx = await this.repository.findOne({
      where: {
        trxNumber,
      },
    })
    return trx
  }
}
