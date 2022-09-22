import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  OneToOne,
} from "typeorm"
import bcrypt from "bcrypt"
import BasicEntity from "./BasicEntity"
import { Wallet } from "./Wallet"
import { UserTypes } from "../types"
import { Provider } from "./Provider"
import { Customer } from "./Customer"

@Entity()
export class Account extends BasicEntity {
  @Column("varchar", {
    unique: true,
  })
  username!: string

  @Column({
    type: "varchar",
    select: false,
  })
  password!: string

  @Column("int", {
    unique: true,
  })
  accountNumber!: number

  
  // hashing passwords
  @AfterLoad()
  loadTempPass = () => {
    this.tempPass = this.password
  }

  @BeforeInsert()
  @BeforeUpdate()
  async setPassword(password: string) {
    if (this.tempPass === this.password) return
    const salt = await bcrypt.genSalt()
    this.password = await bcrypt.hash(password || this.password, salt)
  }

  tempPass?: string

  @OneToMany(() => Wallet, (wallet) => wallet.account)
  wallets!: Wallet[]

  @Column("enum", {
    enum: UserTypes,
    default: UserTypes.CUSTOMER,
  })
  type!: UserTypes

  @Column("date", {
    nullable: true,
  })
  lastLogin?: Date


  // The Account is linked with the provider in one to one relation
  @OneToOne(() => Provider, (provider) => provider.account, {
    onDelete: "CASCADE",
  })
  provider?: Provider

  @OneToOne(() => Customer, (customer) => customer.account, {
    onDelete: "CASCADE",
  })
  customer?: Customer
}
