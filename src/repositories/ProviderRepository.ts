import { DataSource } from "typeorm"
import { Provider } from "../entities/Provider"
import { BaseRepository } from "./BaseRepo"
import { ProviderStatus } from '../types';

export class ProviderRepository extends BaseRepository<Provider> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(Provider)
    super(dbConnection, repo)
  }

  public async getAllByStatus(
    status: ProviderStatus
  ): Promise<number> {
    const result = await this.repository.count({
      where: { status }
    })
    return result
  }

  public async rejectProvider(
    accountId: number
  ) {

    const res = await this.repository.findOne({
      where: { accountId }
    })

    if (res) {
      res.status = ProviderStatus.REJECT
      console.log("the update is done successfully ")
      return await this.update(res)
    }
  }
  
  public async getByAccountId(
    accountId: number,
    relations?: string[]
  ): Promise<Provider | null> {
    const provider = await this.repository.findOne({
      where: { accountId },
      relations,
    })
    return provider
  }

  public async getSystemProvider(): Promise<Provider> {
    return await this.repository.findOneOrFail({
      where: { isSystem: true },
    })
  }

  public async providerCount(): Promise<number> {
    return await this.repository.count()
  }
}
