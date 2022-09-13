import { DataSource, DeepPartial, DeleteResult, Repository } from "typeorm"

export class BaseRepository<T> {
  protected dbConnection: DataSource
  protected repository: Repository<T>

  constructor(dbConnection: DataSource, repository: Repository<T>) {
    this.dbConnection = dbConnection
    this.repository = repository
  }

  public async getById(
    id: number,
    relations?: string[]
  ): Promise<T | undefined> {
    //@ts-ignore
    const result = await this.repository.findOne({ where: { id }, relations })
    if (!result) return undefined
    return result
  }

  //   public async getMany(amt: number, from: ) #TODO pagination

  public async getAll(relations?: string[]): Promise<T[]> {
    const result = await this.repository.find({ relations: relations })
    return result
  }

  public async create(input: DeepPartial<T>): Promise<T> {
    const t = this.repository.create(input)
    return await this.repository.save(t)
  }

  public async createMany(input: DeepPartial<T>[]): Promise<T[]> {
    const result = await this.repository.save(input)
    return result
  }

  public async update(input: DeepPartial<T>): Promise<T> {
    const year = await this.repository.save(input)
    return year
  }

  public async delete(id: number): Promise<DeleteResult> {
    return await this.repository.delete(id)
  }
}
