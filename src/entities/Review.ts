import { Column, Entity, ManyToOne } from "typeorm"
import BasicEntity from "./BasicEntity"
import { Customer } from "./Customer"
import { Provider } from "./Provider"

@Entity()
export class Review extends BasicEntity {
  @ManyToOne(() => Provider, { onDelete: "CASCADE" })
  provider!: Provider

  @Column("int")
  providerId!: number

  @ManyToOne(() => Customer, { onDelete: "CASCADE" })
  customer!: Customer

  @Column("int")
  customerId!: number

  @Column("varchar", { default: "" })
  comment?: string

  @Column("int")
  rating!: number
}
