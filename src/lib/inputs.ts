import Joi from "joi"
import { BusinessAgeUnit } from "../types"

export const ValidateRegisterProvider = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().min(4).required(),
  countryCode: Joi.string().required(),
  businessName: Joi.string().required(),
  businessEmail: Joi.string().allow("").email(),
  businessAddress: Joi.string().required(),
  businessAge: Joi.number().required(),
  businessCategoryId: Joi.number().required(),
  businessAgeUnit: Joi.string()
    .valid(BusinessAgeUnit.MONTHS, BusinessAgeUnit.YEARS)
    .required(),
  businessPhoneNumber: Joi.string()
    .min(12)
    .pattern(/^[+0-9]+$/)
    .required(),
  ownerAddress: Joi.string().required(),
  ownerName: Joi.string().required(),
  ownerNationality: Joi.string().required(),
  ownerEmail: Joi.string().allow("").email(),
  ownerGender: Joi.string().valid("f", "m").required(),
  ownerBirthdate: Joi.date().required(),
  ownerDocumentType: Joi.string()
    .valid("passport", "idcard", "other")
    .required(),
  ownerDocumentNumber: Joi.string().required(),
  language: Joi.string().valid("ar", "en", ""),
  ownerPhoneNumber: Joi.string()
    .min(12)
    .pattern(/^[+0-9]+$/)
    .required(),
  managerAddress: Joi.string(),
  managerName: Joi.string(),
  managerNationality: Joi.string(),
  managerEmail: Joi.string().email(),
  managerGender: Joi.string().valid("f", "m"),
  managerBirthdate: Joi.date(),
  managerDocumentType: Joi.string().valid("passport", "idcard", "other"),
  managerDocumentNumber: Joi.string(),
  managerPhoneNumber: Joi.string()
    .min(12)
    .pattern(/^[+0-9]+$/),
  affiliateCode: Joi.string(),
})

export const ValidateLogin = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  loginType: Joi.string().valid("provider", "customer", "admin").required(),
})

export const ValidateRegisterCustomer = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  countryCode: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().empty("").default(""),
  email: Joi.string().empty("").default(null).email(),
  isVolunteer: Joi.bool().empty("").default(false),
  isInvestor: Joi.bool().empty("").default(false),
  isBusinessOwner: Joi.bool().empty("").default(false),
  phoneNumber: Joi.string()
    .empty("")
    .default(null)
    .min(12)
    .pattern(/^[+0-9]+$/),
  language: Joi.string().valid("ar", "en", ""),
})

export const ValidateApproveProvider = Joi.object({
  providerId: Joi.number().required(),
})

export const ValidateGeneratePoints = Joi.object({
  providerId: Joi.number().required(),
  pointAmount: Joi.number().required(),
  pointType: Joi.string().valid("WHITE", "نقاط بيضاء").required(),
  bonus: Joi.number().min(0).max(200).required(),
  fees: Joi.number().min(0).max(200),
})

export const ValidateCheckFees = Joi.object({
  fromId: Joi.number().required(),
  amount: Joi.number().required(),
})

export const ValidateTransferPoints = Joi.object({
  walletId: Joi.number().required(),
  recepientAccountNumber: Joi.number().required(),
  amount: Joi.number().min(0).required(),
  flagTransfer: Joi.string().required()
})

export const ValidateGetWalletTrx = Joi.object({
  walletId: Joi.number().required(),
  take: Joi.number().default(20),
  skip: Joi.number().default(0),
})

export const ValidateConsumePoints = Joi.object({
  walletId: Joi.number().required(),
  amount: Joi.number().min(0).required(),
  cashierId: Joi.number(),
})

export const ValidateGenerateCCode = Joi.object({
  walletId: Joi.number().required(),
  amount: Joi.number().min(0).required(),
})

export const ValidateConsumeCCode = Joi.object({
  code: Joi.number().required(),
  accountNumber: Joi.number().required(),
  amount: Joi.number().min(1).required(),
})

export const ValidateGetTrxHistoryByDate = Joi.object({
  fromDate: Joi.date().required(),
  toDate: Joi.date().required(),
  incomingOnly: Joi.boolean().default(false),
  outgoingOnly: Joi.boolean().default(false),
  take: Joi.number().default(10).max(30),
  skip: Joi.number().default(0),
  accountId: Joi.number(),
})

export const ValidateGetTrxHistory = Joi.object({
  incomingOnly: Joi.boolean().default(false),
  outgoingOnly: Joi.boolean().default(false),
  take: Joi.number().default(10).max(30),
  skip: Joi.number().default(0),
  accountId: Joi.number(),
})

export const ValidateGetTrxHistoryByAccount = Joi.object({
  incomingOnly: Joi.boolean().default(false),
  outgoingOnly: Joi.boolean().default(false),
  take: Joi.number().default(10).max(10),
  skip: Joi.number().default(0),
})

export const ValidateAddCashier = Joi.object({
  name: Joi.string().required(),
  phoneNumber: Joi.string()
    .min(12)
    .pattern(/^[+0-9]+$/)
    .required(),
  username: Joi.string().required(),
  password: Joi.string().required(),
})

export const ValidateCcodeParams = Joi.object({
  code: Joi.number().required(),
  accountNumber: Joi.number().required(),
})

export const ValidateProviderId = Joi.object({
  providerId: Joi.number().required(),
})

export const ValidateEditProvider = Joi.object({
  id: Joi.number().required(),
  isSystem: Joi.boolean().default(false),
  accountId: Joi.number(),
  businessName: Joi.string(),
  businessEmail: Joi.string().allow("").email(),
  businessAddress: Joi.string(),
  businessPhoneNumber: Joi.string()
    .min(12)
    .pattern(/^[+0-9]+$/),
  countryCode: Joi.string(),
  ownerName: Joi.string(),
  ownerEmail: Joi.string().allow("").email(),
  ownerNationality: Joi.string(),
  ownerGender: Joi.string().valid("f", "m"),
  ownerBirthdate: Joi.date(),
  ownerDocumentType: Joi.string().valid("passport", "idcard", "other"),
  ownerDocumentNumber: Joi.string(),
  language: Joi.string().valid("ar", "en", ""),
  status: Joi.valid("ACTIVE", "PENDING", "INACTIVE", "BANNED"),
  ownerPhoneNumber: Joi.string()
    .min(12)
    .pattern(/^[+0-9]+$/),
})

export const ValidateAdminConsume = Joi.object({
  providerId: Joi.number().required(),
  amount: Joi.number().required(),
})

export const ValidateCreateCountry = Joi.object({
  nameEn: Joi.string().required(),
  nameAr: Joi.string().required(),
  code: Joi.string().required().max(3),
  lang: Joi.string().valid("ar", "en"),
})

export const ValidateUpdateCountry = Joi.object({
  id: Joi.number().required(),
  nameEn: Joi.string(),
  nameAr: Joi.string(),
  code: Joi.string(),
  lang: Joi.string().valid("ar", "en"),
}).unknown(true)

export const ValidateCreateCategory = Joi.object({
  nameEn: Joi.string().required(),
  nameAr: Joi.string().required(),
})

export const ValidateUpdateCategory = Joi.object({
  id: Joi.number().required(),
  nameEn: Joi.string(),
  nameAr: Joi.string(),
}).unknown(true)

export const ValidateCreateAffiliate = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().min(2).required(),
})

export const ValidateUpdateAffiliate = Joi.object({
  name: Joi.string(),
  code: Joi.string().min(4),
}).unknown(true)

export const ValidateCashierId = Joi.object({
  cashierId: Joi.number().required(),
  status: Joi.valid("ACTIVE", "INACTIVE"),
})

export const ValidateAffiliateCode = Joi.object({
  affiliateCode: Joi.string().required(),
})

// export const ValidateEditSystemConf = Joi.object({
// key: Joi.string().required(),
// value: Joi.string().required(),
// })
//

export const ValidateGetTrxByNumber = Joi.object({
  trxNumber: Joi.number().required(),
  accountId: Joi.number().required(),
})

export const ValiateForgotPassword = Joi.object({
  email: Joi.string().email(),
  phoneNumber: Joi.string()
    .min(12)
    .pattern(/^[+0-9]+$/),
  username: Joi.string().required(),
})

export const ValidateUuid = Joi.object({
  uuid: Joi.string().required(),
})

export const ValidateWalletId = Joi.object({
  walletId: Joi.number().required(),
})

export const ValidateAccountId = Joi.object({
  accountId: Joi.number().required(),
})

export const ValidateEditWalletBonusFees = Joi.object({
  walletId: Joi.number().required(),
  fees: Joi.number(),
  bonus: Joi.number(),
})

export const ValidateResetPassword = Joi.object({
  accountId: Joi.number().required(),
  password: Joi.string().required(),
})

export const ValidateRateProvider = Joi.object({
  providerId: Joi.number().required(),
  rating: Joi.number().min(0).max(5).required(),
  comment: Joi.string(),
})

export const ValidateComplaint = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
})

export const ValidateEditProviderProfile = Joi.object({
  businessName: Joi.string(),
  businessEmail: Joi.string().allow("").email(),
  businessAddress: Joi.string(),
  businessPhoneNumber: Joi.string()
    .min(12)
    .pattern(/^[+0-9]+$/),
  countryCode: Joi.string(),
  ownerName: Joi.string(),
  ownerEmail: Joi.string().allow("").email(),
  ownerNationality: Joi.string(),
  ownerGender: Joi.string().valid("f", "m"),
  ownerBirthdate: Joi.date(),
  ownerDocumentType: Joi.string().valid("passport", "idcard", "other"),
  ownerDocumentNumber: Joi.string(),
  ownerPhoneNumber: Joi.string()
    .min(12)
    .pattern(/^[+0-9]+$/),
  language: Joi.string().valid("ar", "en", ""),
}).unknown(true)

export const ValidateEditCustomer = Joi.object({
  username: Joi.string(),
  password: Joi.string(),
  countryCode: Joi.string(),
  firstName: Joi.string(),
  lastName: Joi.string().empty(""),
  email: Joi.string().empty("").default(null).email(),
  phoneNumber: Joi.string()
    .empty("")
    .default(null)
    .min(12)
    .pattern(/^[+0-9]+$/),
  language: Joi.string().valid("ar", "en", ""),
})
