import { Column, Entity, OneToMany } from "typeorm"
import BasicEntity from "./BasicEntity"
import { Provider } from "./Provider"

@Entity()
export class Affiliate extends BasicEntity {
  @Column("varchar")
  name!: string

  @Column("varchar", { unique: true })
  code!: string

  @Column("enum", { enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" })
  status!: "ACTIVE" | "INACTIVE"

  @OneToMany(() => Provider, (p) => p.affiliate, { eager: true })
  providers!: Provider[]
}
