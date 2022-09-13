import { DataSource } from "typeorm"
import { BusinessCategory } from "../entities/BusinessCategory"
import { BaseRepository } from "./BaseRepo"

export class BusinessCategoryRepository extends BaseRepository<BusinessCategory> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(BusinessCategory)
    super(dbConnection, repo)
  }
}
