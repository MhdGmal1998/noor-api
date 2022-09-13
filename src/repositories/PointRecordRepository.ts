import { DataSource } from "typeorm"
import { PointsRecord } from "../entities/CustomerPointsRecord"
import { BaseRepository } from "./BaseRepo"

export class PointRecordRepository extends BaseRepository<PointsRecord> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(PointsRecord)
    super(dbConnection, repo)
  }

  public async updateWalletBalance(
    targetWalletId: number,
    originWalletId: number,
    amount: number
  ) {
    let rec = await this.repository.findOne({
      where: {
        originWalletId,
        targetWalletId,
      },
    })
    if (rec) {
      // record exists, update it
      rec.amount = rec.amount + amount
      return await this.update(rec)
    }
    // no record
    return await this.create({ originWalletId, targetWalletId, amount })
  }
}
