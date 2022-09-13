import { DataSource } from "typeorm"
import { Country } from "../entities/Country"
import { BaseRepository } from "./BaseRepo"

export class CountryRepository extends BaseRepository<Country> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(Country)
    super(dbConnection, repo)
  }
}
