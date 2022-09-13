import { Column, Entity, ManyToOne } from "typeorm"
import { Account } from "./Account"
import BasicEntity from "./BasicEntity"

@Entity()
export class Session extends BasicEntity {
  @ManyToOne(() => Account)
  account!: Account

  @Column("int")
  accountId!: number

  @Column("varchar")
  token!: string

  @Column("boolean", { default: true })
  isValid!: boolean

  @Column("datetime", { nullable: true })
  invaliedAt?: Date
}
