import { Column, Entity } from "typeorm"
import BasicEntity from "./BasicEntity"

@Entity()
export class Country extends BasicEntity {
  @Column("varchar", { unique: true })
  nameAr!: string

  @Column("varchar", { unique: true })
  nameEn!: string

  @Column("varchar", { unique: true })
  code!: string

  @Column("enum", { enum: ["en", "ar"], default: "ar" })
  lang!: "en" | "ar"
}
