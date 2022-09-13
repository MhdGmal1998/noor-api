import { Column, Entity, ManyToOne } from "typeorm"
import BasicEntity from "./BasicEntity"
import { Wallet } from "./Wallet"

@Entity()
export class PointRecord extends BasicEntity {
  @ManyToOne(() => Wallet)
  wallet!: Wallet

  @ManyToOne(() => Wallet)
  originWallet!: Wallet

  @Column("int")
  amount!: number

  @Column("int")
  walletId!: number

  @Column("int")
  originWalletId!: number
}
