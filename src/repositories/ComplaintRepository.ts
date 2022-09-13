import { DataSource } from "typeorm"
import { ComplaintStatus } from "../types"
import { Complaint } from "../entities/Complaint"
import { BaseRepository } from "./BaseRepo"

export class ComplaintRepository extends BaseRepository<Complaint> {
  constructor(dbConnection: DataSource) {
    const repo = dbConnection.getRepository(Complaint)
    super(dbConnection, repo)
  }

  public async setToResolved(complaintId: number): Promise<Complaint | null> {
    const complaint = await this.getById(complaintId)
    if (!complaint) return null
    complaint.status = ComplaintStatus.RESOLVED
    return this.repository.save(complaint)
  }

  public async getAllPending(): Promise<Complaint[]> {
    return this.repository.find({
      where: {
        status: ComplaintStatus.PENDING,
      },
    })
  }
}
