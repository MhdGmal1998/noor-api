import { Column, Entity, ManyToOne, Unique } from "typeorm"
import BasicEntity from "./BasicEntity"
import { Wallet } from "./Wallet"

@Entity()
@Unique("UQ_RCD", ["targetWalletId", "originWalletId"])
export class PointsRecord extends BasicEntity {
  // the wallet in which this points record is stored
  @ManyToOne(() => Wallet)
  targetWallet!: Wallet

  @Column("int")
  targetWalletId!: number

  // the wallet origin of this points record (provider wallet)
  @ManyToOne(() => Wallet)
  originWallet!: Wallet

  @Column("int")
  originWalletId!: number

  @Column("float")
  amount!: number
}
