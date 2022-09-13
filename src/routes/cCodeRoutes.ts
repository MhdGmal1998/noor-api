import express from "express"
import { createValidator } from "express-joi-validation"
import ConsumptionCodeController from "../controllers/cCodeController"
import {
  ValidateCcodeParams,
  ValidateConsumeCCode,
  ValidateConsumePoints,
} from "../lib/inputs"
import { authenticate, isActiveUser } from "../middleware/auth"
const router = express.Router()

const validator = createValidator()
const controller = new ConsumptionCodeController()

// #TODO get code BEFORE ConsumptionCodeController
router
  .route("/:accountNumber/:code")
  .get(
    authenticate,
    isActiveUser,
    validator.params(ValidateCcodeParams),
    controller.checkCode
  )
router
  .route("/consume")
  .post(
    authenticate,
    isActiveUser,
    validator.body(ValidateConsumeCCode),
    controller.consumeCode
  )

router
  .route("/")
  .post(
    authenticate,
    isActiveUser,
    validator.body(ValidateConsumePoints),
    controller.generateConsumeCode
  )

export default {
  router,
  path: "ccode",
}
