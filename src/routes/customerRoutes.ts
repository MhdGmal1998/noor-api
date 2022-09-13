import express from "express"
import { createValidator } from "express-joi-validation"
import CustomerController from "../controllers/customerController"
import { ValidateEditCustomer, ValidateRegisterCustomer } from "../lib/inputs"
import { authenticate, isActiveUser } from "../middleware/auth"
const router = express.Router()

const validator = createValidator()
const controller = new CustomerController()

router
  .route("/new")
  .post(
    validator.body(ValidateRegisterCustomer),
    controller.createCustomerAccount
  )

router.route("/me").get(authenticate, isActiveUser, controller.getCustomerInfo)

router
  .route("/edit")
  .post(
    authenticate,
    isActiveUser,
    validator.body(ValidateEditCustomer),
    controller.editCustomerProfile
  )

export default {
  router,
  path: "customers",
}
