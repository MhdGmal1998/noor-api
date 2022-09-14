import express from "express"
import { createValidator } from "express-joi-validation"
import AdminController from "../controllers/adminController"
import {
  ValidateAccountId,
  ValidateAddCashier,
  ValidateAdminConsume,
  ValidateApproveProvider,
  ValidateCreateAffiliate,
  ValidateEditWalletBonusFees,
  ValidateGeneratePoints,
  ValidateProviderId,
  ValidateResetPassword,
  ValidateUpdateAffiliate,
  ValidateWalletId,
} from "../lib/inputs"
import { authenticate, isAdmin } from "../middleware/auth"
const router = express.Router()

const validator = createValidator()
const controller = new AdminController()

router
  .route("/pending")
  .get(authenticate, isAdmin, controller.getPendingProviders)


router
  .route("/getAllRequest")
  .get(controller.getAllRequest)

router
.route("/reject")
.post(
  authenticate,
  isAdmin,
  controller.rejectProvider
)

router
  .route("/approve")
  .post(
    authenticate,
    isAdmin,
    validator.body(ValidateApproveProvider),
    controller.approveProvider
  )

router.route("/providers").get(authenticate, isAdmin, controller.listProviders)

router
  .route("/generateCredit")
  .post(
    authenticate,
    isAdmin,
    validator.body(ValidateGeneratePoints),
    controller.generateProviderCredit
  )

router
  .route("/providers/:providerId")
  .get(
    authenticate,
    isAdmin,
    validator.params(ValidateProviderId),
    controller.getProviderById
  )

router
  .route("/providers/cashier/:providerId")
  .post(
    authenticate,
    isAdmin,
    validator.params(ValidateProviderId),
    validator.body(ValidateAddCashier),
    controller.createProviderCashier
  )

router
  .route("/providers/:providerId")
  .post(authenticate, isAdmin, controller.editProvider)

router.route("/").get(authenticate, isAdmin, controller.getAdminInformation)

router.route("/customers").get(authenticate, isAdmin, controller.customerList)

router
  .route("/customers/:cid")
  .get(authenticate, isAdmin, controller.getCustomerById)

router
  .route("/customer/:cid")
  .post(authenticate, isAdmin, controller.editCustomer)

router
  .route("/consume")
  .post(
    authenticate,
    isAdmin,
    validator.body(ValidateAdminConsume),
    controller.consume
  )

router
  .route("/wallets")
  .get(authenticate, isAdmin, controller.getSystemWalletList)

router
  .route("/affiliate/new")
  .post(
    authenticate,
    isAdmin,
    validator.body(ValidateCreateAffiliate),
    controller.createAffiliate
  )

router.route("/affiliate").get(authenticate, isAdmin, controller.listAffiliates)

router
  .route("/affiliate")
  .post(
    authenticate,
    isAdmin,
    validator.body(ValidateUpdateAffiliate),
    controller.updateAffiliate
  )

router
  .route("/maprecords")
  .post(
    authenticate,
    isAdmin,
    validator.body(ValidateProviderId),
    controller.mapRecordsToBonuses
  )

router
  .route("/deactivatewallet")
  .post(
    authenticate,
    isAdmin,
    validator.body(ValidateWalletId),
    controller.deactivateWallet
  )
router
  .route("/activatewallet")
  .post(
    authenticate,
    isAdmin,
    validator.body(ValidateWalletId),
    controller.activateWallet
  )
router
  .route("/deleteaccount")
  .post(
    authenticate,
    isAdmin,
    validator.body(ValidateAccountId),
    controller.deleteAccount
  )
// router.route("/resetpassword")

router
  .route("/editwallet")
  .post(
    authenticate,
    validator.body(ValidateEditWalletBonusFees),
    isAdmin,
    controller.editWallet
  )

router
  .route("/resetpassword")
  .post(
    authenticate,
    validator.body(ValidateResetPassword),
    isAdmin,
    controller.resetUserPassword
  )

export default {
  router,
  path: "admin",
}
