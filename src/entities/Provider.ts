import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from "typeorm"
import BasicEntity from "./BasicEntity"
import { BusinessAgeUnit, ProviderStatus } from "../types"
import { Account } from "./Account"
import { Wallet } from "./Wallet"
import { BusinessCategory } from "./BusinessCategory"
import { Affiliate } from "./Affiliate"
import { Cashier } from "./Cashier"

@Entity()
export class Provider extends BasicEntity {
  @Column("boolean", { default: false })
  isSystem!: boolean

  @Column("int")
  accountId!: number

  @OneToOne(() => Account, { onDelete: "CASCADE" })
  @JoinColumn()
  account!: Account

  //business details
  @Column("varchar")
  businessName!: string

  @Column("int", { default: 0 })
  businessAge!: number

  @Column("enum", { enum: BusinessAgeUnit, default: BusinessAgeUnit.YEARS })
  businessAgeUnit!: BusinessAgeUnit

  @Column("varchar", { nullable: true })
  // @Index({ unique: true, where: "businessEmail IS NOT NULL" })
  businessEmail?: string

  @Column("varchar")
  businessAddress!: string

  @Column("varchar")
  // @Index({ unique: true, where: "businessPhoneNumber IS NOT NULL" })
  businessPhoneNumber!: string

  @Column("varchar", { default: "sd" })
  countryCode!: string

  //owner details

  @Column("varchar")
  ownerName!: string

  @Column("varchar", { nullable: true })
  // @Index({ unique: true, where: "ownerEmail IS NOT NULL" })
  ownerEmail?: string

  @Column("varchar")
  ownerNationality!: string

  @Column("enum", { enum: ["f", "m"] })
  ownerGender!: "f" | "m"

  @Column("date")
  ownerBirthdate!: Date

  @Column("enum", { enum: ["passport", "idcard", "other"] })
  ownerDocumentType!: "passport" | "idcard" | "other"

  @Column("varchar", { unique: true })
  ownerDocumentNumber!: string

  @Column("varchar")
  ownerAddress!: string

  // manager details
  @Column("varchar")
  managerName!: string

  @Column("varchar", { nullable: true })
  managerEmail?: string

  @Column("varchar")
  managerNationality!: string

  @Column("enum", { enum: ["f", "m"] })
  managerGender!: "f" | "m"

  @Column("date", { default: "1970-01-01" })
  managerBirthdate!: Date

  @Column("enum", { enum: ["passport", "idcard", "other"] })
  managerDocumentType!: "passport" | "idcard" | "other"

  @Column("varchar", { unique: true })
  managerDocumentNumber!: string

  @Column("varchar")
  managerAddress!: string

  @Column("datetime", { nullable: true })
  phoneVerifiedAt?: Date

  @Column("datetime", { nullable: true })
  emailVerifiedAt?: Date

  @Column("enum", { enum: ProviderStatus, default: ProviderStatus.PENDING })
  status!: ProviderStatus

  @Column("enum", { enum: ["en", "ar"], nullable: true })
  language?: "en" | "ar"

  // wallets of users who have points from this provider
  @OneToMany(() => Wallet, (wa) => wa.provider)
  wallets!: Wallet[]

  // Categories of business
  @ManyToOne(() => BusinessCategory, { nullable: true })
  businessCategory?: BusinessCategory

  @Column("int", { nullable: true })
  businessCategoryId?: number

  @ManyToOne(() => Affiliate, { nullable: true })
  affiliate?: Affiliate

  @OneToMany(() => Cashier, (c) => c.provider, { onDelete: "CASCADE" })
  cashiers!: Cashier[]
}
