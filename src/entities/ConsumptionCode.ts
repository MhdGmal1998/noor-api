import { Column, Entity, ManyToOne } from "typeorm"
import { ConsumptionCodeStatus } from "../types"
// import { Account } from "./Account"
import BasicEntity from "./BasicEntity"
import { Provider } from "./Provider"

@Entity()
export class ConsumptionCode extends BasicEntity {
  @Column("decimal")
  accountNumber!: number

  @ManyToOne(() => Provider)
  provider!: Provider

  @Column("int")
  providerId!: number

  @Column("enum", {
    enum: ConsumptionCodeStatus,
    default: ConsumptionCodeStatus.PENDING,
  })
  status!: ConsumptionCodeStatus

  @Column("float")
  amount!: number

  @Column("int")
  code!: number
}
