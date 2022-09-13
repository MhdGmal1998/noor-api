import { Column, Entity, ManyToOne } from "typeorm"
import { ComplaintStatus } from "../types"
import { Account } from "./Account"
import BasicEntity from "./BasicEntity"

@Entity()
export class Complaint extends BasicEntity {
  @Column("varchar")
  title!: string

  @Column("varchar")
  description!: string

  @Column("enum", { enum: ComplaintStatus, default: ComplaintStatus.PENDING })
  status!: ComplaintStatus

  @ManyToOne(() => Account, { nullable: true })
  account?: Account

  @Column("int", { nullable: true })
  accountId?: number
}
