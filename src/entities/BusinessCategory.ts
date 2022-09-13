import { Column, Entity } from "typeorm"
import BasicEntity from "./BasicEntity"

@Entity()
export class BusinessCategory extends BasicEntity {
  @Column("varchar")
  nameAr!: string

  @Column("varchar")
  nameEn!: string
}
