import { AfterLoad, Column, Entity, ManyToOne, OneToMany } from "typeorm"
import { PointTypes, WalletStatus, WalletTypes, typeWallet } from '../types';
import Log from "../util/Log"
import { Account } from "./Account"
import BasicEntity from "./BasicEntity"
import { PointsRecord } from "./CustomerPointsRecord"
import { Provider } from "./Provider"
import { Transaction } from "./Transaction"

@Entity()
export class Wallet extends BasicEntity {
  @Column("int", { unique: true })
  walletNumber!: number

  @ManyToOne(() => Provider)
  provider?: Provider

  // this.points = []
  // { wId: x, amount: y }

  @Column("float", { nullable: true })
  bonus?: number

  @Column("float", { nullable: true })
  fees?: number

  @Column("int", { nullable: true })
  providerId?: number

  @ManyToOne(() => Account)
  account!: Account

  @Column("int")
  accountId!: number

  @AfterLoad()
  calculateBalance = () => {
    Log.debug("AFTERLOAD : " + this.id)
    if (this.walletType !== WalletTypes.PROVIDER && this.records) {
      const balance = this.records.reduce((acc, cur) => acc + cur.amount, 0)
      this.balance = Number(balance.toFixed(2))
    }
  }

  @Column("float", { default: 0 })
  balance!: number

  @OneToMany(() => PointsRecord, (cpr) => cpr.targetWallet, { eager: true })
  records!: PointsRecord[]

  @Column("enum", { enum: PointTypes, default: PointTypes.WHITE })
  pointType!: PointTypes

  @Column("enum", { enum: typeWallet, default: typeWallet.SALE })
  typeWallet!: typeWallet

  

  @Column("enum", { enum: WalletTypes })
  walletType!: WalletTypes

  @Column("int", { default: 0 })
  totalTrx!: number

  @Column("float", { default: 0 })
  totalConsume!: number

  @Column("float", { default: 0 })
  totalSold!: number

  @OneToMany(() => Transaction, (t) => t.fromWallet)
  outgoingTransactions!: Transaction[]

  @OneToMany(() => Transaction, (t) => t.toWallet)
  incomingTransactions!: Transaction[]

  @Column("enum", { enum: WalletStatus, default: WalletStatus.ACTIVE })
  status!: WalletStatus
}