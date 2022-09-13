import { Column, Entity, ManyToOne, OneToOne } from "typeorm"
import { CashierStatus } from "../types"
import { Account } from "./Account"
import BasicEntity from "./BasicEntity"
import { Provider } from "./Provider"

@Entity()
export class Cashier extends BasicEntity {
  @Column("varchar")
  name!: string

  @Column("varchar")
  phoneNumber!: string

  @OneToOne(() => Account)
  account!: Account

  @Column("int")
  accountId!: number

  @ManyToOne(() => Provider)
  provider!: Provider

  @Column("int")
  providerId!: number

  @Column("enum", { enum: CashierStatus, default: CashierStatus.ACTIVE })
  status!: CashierStatus
}
