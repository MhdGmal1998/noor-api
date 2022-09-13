import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity()
export default class BasicEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @CreateDateColumn()
  readonly createdAt!: Date

  @UpdateDateColumn()
  readonly updatedAt?: Date

  @DeleteDateColumn()
  readonly deletedAt?: Date
}
