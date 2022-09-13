import { Provider } from "../entities/Provider"
import { Wallet } from "../entities/Wallet"
import { BadInputError } from "../errors/BadInputError"
import { NotAllowedError } from "../errors/NotAllowedError"
import { ProviderStatus, WalletTypes } from "../types"

export const denyNotWalletOwner = (
  userId: number | string,
  wallet: Wallet,
  message: string = "You are not the owner of this wallet"
) => {
  if (wallet.accountId !== Number(userId)) throw new NotAllowedError(message)
}

export const denyWalletNotOwnerOrCustomer = (
  userId: number | string,
  wallet: Wallet,
  message: string = "أنت لست مالك هذه المحفظة."
) => {
  denyNotWalletOwner(userId, wallet, message)
  if (wallet.walletType === WalletTypes.PROVIDER)
    throw new NotAllowedError("لايمكنك إتمام هذه العملية بهذه المحفظة")
}

export const denyUndefined = (
  value: any,
  message: string = "Undefined value"
) => {
  if (value === undefined) throw new BadInputError(message)
}

export const denyProviderInactive = (
  provider: Provider,
  message: string = "مزود الخدمة غير مفعّل"
) => {
  if (provider.status !== ProviderStatus.ACTIVE)
    throw new NotAllowedError(message)
}
