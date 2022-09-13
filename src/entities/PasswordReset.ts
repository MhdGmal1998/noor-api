import { Column, Entity, ManyToOne } from "typeorm";
import { Account } from "./Account";
import BasicEntity from "./BasicEntity";

@Entity()
export class PasswordReset extends BasicEntity {
	@Column("varchar")
	uuid!: string

	@Column("boolean", {default: true})
	isValid!: boolean

	@ManyToOne(() => Account, {eager: true})
	account!: Account

	@Column("int")
    accountId!: number
}
