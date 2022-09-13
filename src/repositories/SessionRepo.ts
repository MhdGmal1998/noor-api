import { Session } from "../entities/Session"
import { DataSource } from "typeorm"
import { BaseRepository } from "./BaseRepo"

export class SessionRepository extends BaseRepository<Session> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(Session)
    super(dbConnection, repo)
  }

  public async findByToken(token: string): Promise<Session | null> {
    return this.repository.findOne({
      where: {
        token,
        isValid: true,
      },
    })
  }

  public async invaliate(token: string): Promise<void> {
    await this.repository.update({ token }, { invaliedAt: new Date() })
  }

  public async startNewSession(
    token: string,
    accountId: number,
    logoutAllOtherSessions: boolean = true
  ): Promise<void> {
    if (logoutAllOtherSessions)
      await this.repository.update(
        { accountId, isValid: true },
        { isValid: false }
      )
    await this.repository.insert({ token, accountId })
  }
}
