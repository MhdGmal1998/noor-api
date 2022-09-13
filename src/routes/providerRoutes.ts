import express from "express"
import { createValidator } from "express-joi-validation"
import { ProviderController } from "../controllers/providerController"
import {
  ValidateAddCashier,
  ValidateAffiliateCode,
  ValidateCashierId,
  ValidateProviderId,
  ValidateRateProvider,
  ValidateRegisterProvider,
} from "../lib/inputs"
import { authenticate, isActiveUser } from "../middleware/auth"
const router = express.Router()

const validator = createValidator()
const controller = new ProviderController()

router
  .route("/new")
  .post(
    validator.body(ValidateRegisterProvider),
    controller.registerNewProvider
  )

router.route("/me").get(authenticate, isActiveUser, controller.getProviderInfo)

router.route("/").get(controller.getActiveProviders)

// create cashier
router
  .route("/cashier/add")
  .post(
    authenticate,
    isActiveUser,
    validator.body(ValidateAddCashier),
    controller.addCashier
  )

router
  .route("/cashier/status")
  .post(
    authenticate,
    isActiveUser,
    validator.body(ValidateCashierId),
    controller.updateCashierStatus
  )

// get cashiers
router.route("/cashier").get(authenticate, controller.getCashierList)

// get cashiers
router
  .route("/cashier/:providerId")
  .get(
    authenticate,
    validator.params(ValidateProviderId),
    controller.getCashierByProviderId
  )

// customers (UNTESTED)
router
  .route("/customers")
  .get(authenticate, isActiveUser, controller.getCustomerList)

router
  .route("/affiliate/:code")
  .get(
    authenticate,
    validator.params(ValidateAffiliateCode),
    controller.getAffiliate
  )

router
  .route("/rate")
  .post(
    authenticate,
    isActiveUser,
    validator.body(ValidateRateProvider),
    controller.rateProvider
  )

export default {
  router,
  path: "providers",
}
