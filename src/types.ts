export enum UserTypes {
  PROVIDER = "PROVIDER",
  CUSTOMER = "CUSTOMER",
  ADMIN = "ADMIN",
  CASHIER = "CASHIER",
}

export enum ProviderStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BANNED = "BANNED",
}

export enum CustomerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BANNED = "BANNED",
}

export enum PointTypes {
  WHITE = "نقاط بيضاء",
}

export enum WalletStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum TransactionTypes {
  TRANSFER = "TRANSFER",
  GIFT = "GIFT",
  PURCHASE = "PURCHASE",
  FEES = "FEES",
}

export enum WalletTypes {
  PROVIDER = "PROVIDER",
  CUSTOMER = "CUSTOMER",
  SYSTEM = "SYSTEM",
  ORIGIN = "ORIGIN",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
}

export enum ConsumptionCodeStatus {
  PENDING = "PENDING",
  EXPIRED = "EXPIRED",
  USED = "USED",
}

export enum CashierStatus {
  ACTIVE = "ACTIVE",
  DISABLED = "DISABLED",
  INACTIVE = "INACTIVE",
}

export enum BusinessAgeUnit {
  DAYS = "DAYS",
  MONTHS = "MONTHS",
  YEARS = "YEARS",
}

export type CustomerWalletPoints = {
  walletId: number
  amount: number
}

export enum ComplaintStatus {
  PENDING = "PENDING",
  RESOLVED = "RESOLVED",
}
