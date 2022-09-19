import { DataSource } from "typeorm"
import { Provider } from "../entities/Provider"
import dotenv from "dotenv"
import path from "path"
import { Customer } from "../entities/Customer"
import { Session } from "../entities/Session"
import { Account } from "../entities/Account"
import { Transaction } from "../entities/Transaction"
import { Wallet } from "../entities/Wallet"
import { ConsumptionCode } from "../entities/ConsumptionCode"
import { Cashier } from "../entities/Cashier"
import { Affiliate } from "../entities/Affiliate"
import { Country } from "../entities/Country"
import { BusinessCategory } from "../entities/BusinessCategory"
import { PointsRecord } from "../entities/CustomerPointsRecord"
import { SystemConfiguration } from "../entities/SystemConfiguration"
import { PasswordReset } from "../entities/PasswordReset"
import { Review } from "../entities/Review"
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") })

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.HOST,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  synchronize: true,
  migrationsRun:false,
  entities: [
    ConsumptionCode,
    SystemConfiguration,
    Transaction,
    Wallet,
    PasswordReset,
    Account,
    Customer,
    Provider,
    Cashier,
    Affiliate,
    Country,
    BusinessCategory,
    PointsRecord,
    Session,
    Review,
  ],
  migrations: ['../migrations/*.ts'],
  
  dropSchema: process.argv.includes("--drop"),
  logging: process.argv.includes("--log"),
  
})

export const createDbConnection = async () => {
  await AppDataSource.initialize()
}
