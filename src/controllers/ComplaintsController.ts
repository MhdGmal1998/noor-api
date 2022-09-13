import { ComplaintRepository } from "../repositories/ComplaintRepository"
import { Request, Response, NextFunction } from "express"
import Log from "../util/Log"
import { AppDataSource } from "../infrastructure/typeorm"
import { Complaint } from "../entities/Complaint"
import { NotFoundError } from "../errors/NotFoundError"
import { ComplaintStatus } from "../types"

export class ComplaintController {
  public async newComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new ComplaintRepository(AppDataSource)
      let complaint = new Complaint()
      complaint.description = req.body.description
      complaint.title = req.body.title
      if (req.user && req.user.userId)
        complaint.accountId = Number(req.user.userId)
      complaint = await repo.create(complaint)
      return res.status(201).json(complaint)
    } catch (error: any) {
      Log.error(`complaintController.newComplaint: ${error}`)
      res.status(error.statusCode ?? 500).json({ error: error.message })
      return next()
    }
  }

  // get all unresolved complaints
  public async getUnresolvedComplaints(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const repo = new ComplaintRepository(AppDataSource)
      const complaints = await repo.getAllPending()
      return res.status(200).json(complaints)
    } catch (error: any) {
      Log.error(`complaintController.getUnresolvedComplaints: ${error}`)
      res.status(error.statusCode ?? 500).json({ error: error.message })
      return next()
    }
  }

  // resolve complaint
  public async resolveComplaint(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const repo = new ComplaintRepository(AppDataSource)
      let complaint = await repo.getById(Number(req.params.id))
      if (!complaint) throw new NotFoundError("Complaint not found!")
      complaint.status = ComplaintStatus.RESOLVED
      complaint = await repo.update(complaint)
      return res.status(200).json(complaint)
    } catch (error: any) {
      Log.error(`complaintController.resolveComplaint: ${error}`)
      res.status(error.statusCode ?? 500).json({ error: error.message })
      return next()
    }
  }
}
