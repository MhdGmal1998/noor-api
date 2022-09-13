import express from "express"
import { createValidator } from "express-joi-validation"
import { AuthController } from "../controllers/authController"
import { ValiateForgotPassword, ValidateLogin, ValidateUuid } from "../lib/inputs"
const router = express.Router()

const validator = createValidator()
const controller = new AuthController()

router.route("/login").post(validator.body(ValidateLogin), controller.login)
router.route("/reset-password").post(validator.body(ValiateForgotPassword), controller.sendResetPasswordEmail)
router.route("/reset-password/:uuid").get(validator.params(ValidateUuid), controller.resetPasswordCheck)
// router.route("/test").post(authenticate, controller.test)

export default {
  router,
  path: "auth",
}
