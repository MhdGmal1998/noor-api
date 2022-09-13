import express from "express"
import { createValidator } from "express-joi-validation"
import SystemConfigurationController from "../controllers/configController"
import {
  ValidateCreateCategory,
  ValidateCreateCountry,
  ValidateEditSystemConf,
  ValidateUpdateCategory,
  ValidateUpdateCountry,
} from "../lib/inputs"
import { authenticate, isAdmin } from "../middleware/auth"
const router = express.Router()

const controller = new SystemConfigurationController()
const validator = createValidator()

router.route("/").get(controller.getSystemConf)

router.route("/").post(authenticate, isAdmin, controller.updateSystemConf)

router
  .route("/country/new")
  .post(
    authenticate,
    isAdmin,
    validator.body(ValidateCreateCountry),
    controller.createCountry
  )

router
  .route("/country")
  .post(
    authenticate,
    isAdmin,
    validator.body(ValidateUpdateCountry),
    controller.updateCountry
  )

router
  .route("/category/new")
  .post(
    authenticate,
    isAdmin,
    validator.body(ValidateCreateCategory),
    controller.createCategory
  )

router
  .route("/category")
  .post(
    authenticate,
    isAdmin,
    validator.body(ValidateUpdateCategory),
    controller.updateCategory
  )

export default {
  router,
  path: "config",
}
