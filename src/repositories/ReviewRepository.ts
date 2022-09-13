import { DataSource } from "typeorm"
import { Review } from "../entities/Review"
import { BaseRepository } from "./BaseRepo"

export class ReviewRepository extends BaseRepository<Review> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(Review)
    super(dbConnection, repo)
  }

  public async rate(
    providerId: number,
    customerId: number,
    rating: number,
    comment?: string
  ): Promise<Review | null> {
    if (await this.exists(providerId, customerId)) return null
    return await this.repository.save({
      providerId,
      customerId,
      rating,
      comment,
    })
  }

  public async exists(providerId: number, customerId: number) {
    return await this.repository.count({
      where: {
        providerId,
        customerId,
      },
    })
  }
}
