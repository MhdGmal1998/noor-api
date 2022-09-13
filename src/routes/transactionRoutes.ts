import express from "express"
import { createValidator } from "express-joi-validation"
import { TransactionController } from "../controllers/transactionController"
import {
  ValidateConsumePoints,
  ValidateGetTrxByNumber,
  ValidateGetTrxHistory,
  ValidateGetTrxHistoryByDate,
  ValidateTransferPoints,
} from "../lib/inputs"
import { authenticate, isActiveUser } from "../middleware/auth"
const router = express.Router()

const validator = createValidator()
const controller = new TransactionController()

router.route("/:acn").get(authenticate, controller.getAccountInfo)

router
  .route("/transfer")
  .post(
    authenticate,
    isActiveUser,
    validator.body(ValidateTransferPoints),
    controller.transferPoints
  )

router
  .route("/consume")
  .post(
    authenticate,
    isActiveUser,
    validator.body(ValidateConsumePoints),
    controller.consumePoint
  )

router
  .route("/history")
  .post(
    authenticate,
    validator.body(ValidateGetTrxHistoryByDate),
    controller.getTrxFromDates
  )

router
  .route("/history/latest")
  .post(
    authenticate,
    validator.body(ValidateGetTrxHistory),
    controller.getLatestTrx
  )

router
  .route("/find")
  .post(
    authenticate,
    validator.body(ValidateGetTrxByNumber),
    controller.getTrxByTrxNumber
  )


// router.route("/latest").get(authenticate, controller.getTrxFromDates)

export default {
  router,
  path: "trx",
}
