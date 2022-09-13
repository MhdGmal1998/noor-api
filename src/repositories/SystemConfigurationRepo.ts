import { DataSource } from "typeorm"
import { BaseRepository } from "./BaseRepo"
import { SystemConfiguration } from "../entities/SystemConfiguration"

export class SystemConfigurationRepository extends BaseRepository<SystemConfiguration> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(SystemConfiguration)
    super(dbConnection, repo)
  }

  public async getByKey(key: string): Promise<SystemConfiguration | null> {
    return await this.repository.findOne({ where: { key } })
  }

  public async getValueByKey(key: string): Promise<string | null> {
    const config = await this.getByKey(key)
    return config ? config.value : null
  }

  public async updateByKey(
    key: string,
    value: string
  ): Promise<SystemConfiguration | null> {
    const config = await this.getByKey(key)
    if (config) {
      config.value = value
      return await this.update(config)
    }
    return config
  }
}
