import { Column, Entity, ManyToOne, Unique } from "typeorm"
import { PointTypes, TransactionStatus, TransactionTypes } from "../types"
import BasicEntity from "./BasicEntity"
import { Cashier } from "./Cashier"
import { Wallet } from "./Wallet"

@Entity()
@Unique("UQ_TRX", ["id", "trxNumber"])
export class Transaction extends BasicEntity {
  // NOT unique on its own.
  @Column("int", { width: 11 })
  trxNumber!: number

  @ManyToOne(() => Wallet)
  fromWallet!: Wallet

  @Column("int")
  fromWalletId!: number

  @ManyToOne(() => Wallet)
  toWallet!: Wallet

  @Column("int")
  toWalletId!: number

  @Column("float")
  amount!: number

  @Column("enum", { enum: PointTypes, default: PointTypes.WHITE })
  pointType!: PointTypes

  @Column("enum", { enum: TransactionTypes })
  transactionType!: TransactionTypes

  @ManyToOne(() => Cashier, { nullable: true })
  cashier?: Cashier

  @Column("int", { nullable: true })
  cashierId?: number

  @Column("enum", {
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status!: TransactionStatus
}
