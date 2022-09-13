import { Column, Entity } from "typeorm"
import BasicEntity from "./BasicEntity"

@Entity()
export class SystemConfiguration extends BasicEntity {
  @Column("varchar", { unique: true })
  key!: string

  @Column("varchar")
  value!: string
}
