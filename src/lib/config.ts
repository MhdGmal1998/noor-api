import dotenv from "dotenv"
import path from "path"
dotenv.config({ path: path.join(__dirname, "..", ".env") })

export default {
  accountNumberLength: 7,
  walletNumberLength: 7,
  cCodeNumberLength: 6,
  cCodeExpirationHours: 1,
  fees: {
    spendingFees: 2,
    receivingFees: 2,
  },
  JWT_SECRET: process.env.JWT_SECRET,
  defaultSystemUsername: "system",
  defaultSystemPassword: "123456",
  defaultSystemProvider: {
    businessName: "SYSTEM",
    businessAdress: "SYSTEM",
    businessPhoneNumber: "SYSTEM",
    ownerName: "SYSTEM",
    ownerNationality: "SYSTEM",
    ownerGender: "m",
    ownerBirthdate: "1970-01-01",
    ownerDocumentType: "other",
    ownerDocumentNumber: 1,
    ownerAddress: "SYSTEM",
    status: "ACTIVE",
    language: "ar",
    isSystem: true,
    accountId: 0,
    businessAddress: "SYSTEM",
    countryCode: "sd",
  },
}
