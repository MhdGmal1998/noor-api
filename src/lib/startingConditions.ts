import { generateWalletNumber } from "../controllers/adminController"
import { SystemConfiguration } from "../entities/SystemConfiguration"
import { Wallet } from "../entities/Wallet"
import { AppDataSource } from "../infrastructure/typeorm"
import { AccountRepository } from "../repositories/AccountRepo"
import { SystemConfigurationRepository } from "../repositories/SystemConfigurationRepo"
import { WalletRepository } from "../repositories/WalletRepository"
import constants from "../util/constants"

export default async () => {
  // find system account
  const accountRepo = new AccountRepository(AppDataSource)
  const walletRepo = new WalletRepository(AppDataSource)
  const configRepo = new SystemConfigurationRepository(AppDataSource)
  // known config
  for (var c in constants.DEFAULT_SYSTEM_CONF) {
    const config = await configRepo.getByKey(c)
    if (!config) {
      const newConfig = new SystemConfiguration()
      newConfig.key = c
      // @ts-ignore
      newConfig.value = constants.DEFAULT_SYSTEM_CONF[c]
      await configRepo.create(newConfig)
    }
  }
  const systemAccount = await accountRepo.getSystemAccount()
  const originWallet = await walletRepo.getOriginWallet()
  if (!originWallet) {
    await walletRepo.createOriginWallet(
      systemAccount.id,
      await generateWalletNumber(AppDataSource.getRepository(Wallet))
    )
  }
}
