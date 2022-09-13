import { DataSource } from "typeorm"
import { PasswordReset } from "../entities/PasswordReset"
import { BaseRepository } from "./BaseRepo"

export class PasswordResetRepository extends BaseRepository<PasswordReset> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(PasswordReset)
    super(dbConnection, repo)
  }

  public async getByUUID(uuid: string): Promise<PasswordReset | null> {
	return this.repository.findOne({
		where: {
			uuid
		}
	})
  }
}
