import { DataSource } from "typeorm"
import { Customer } from "../entities/Customer"
import { BaseRepository } from "./BaseRepo"

export class CustomerRepository extends BaseRepository<Customer> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(Customer)
    super(dbConnection, repo)
  }

  public async getAllOfProvider(providerId: number): Promise<Customer[]> {
    const query = await this.repository
      .createQueryBuilder("c")
      // .where("c.providerId = :providerId", { providerId })
      .innerJoinAndSelect("c.account", "a")
      // .leftJoinAndSelect("a.wallets", "w")
      // .where("w.providerId = :providerId", { providerId })
      // .select("c", "customer")
      .getMany()
    return query
  }


  public async getByAccountId(
    accountId: number,
    relations?: string[]
  ): Promise<Customer | null> {
    const customer = await this.repository.findOne({
      where: { accountId },
      relations,
    })
    return customer
  }

  public async customerCount(): Promise<number> {
    return await this.repository.count()
  }
}
