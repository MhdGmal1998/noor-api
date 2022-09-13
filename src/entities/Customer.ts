import { Column, Entity, JoinColumn, OneToOne } from "typeorm"
import BasicEntity from "./BasicEntity"
import { CustomerStatus } from "../types"
import { Account } from "./Account"

@Entity()
export class Customer extends BasicEntity {
  @Column("varchar")
  firstName!: string

  @Column("varchar")
  lastName!: string

  @Column("int")
  accountId!: number

  @OneToOne(() => Account, { onDelete: "CASCADE" })
  @JoinColumn()
  account!: Account

  @Column("varchar", { nullable: true, unique: true })
  email?: string

  @Column("varchar", { nullable: true, unique: true })
  phoneNumber?: string

  @Column("enum", { enum: ["en", "ar"], nullable: true })
  language?: "en" | "ar"

  @Column("datetime", { nullable: true })
  phoneVerifiedAt?: Date

  @Column("datetime", { nullable: true })
  emailVerifiedAt?: Date

  @Column("varchar", { default: "sd" })
  countryCode!: string

  @Column("enum", { enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status!: CustomerStatus

  @Column("boolean", { default: false })
  isInvestor!: boolean

  @Column("boolean", { default: false })
  isVolunteer!: boolean

  @Column("boolean", { default: false })
  isBusinessOwner!: boolean
}
