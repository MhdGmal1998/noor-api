import express from "express"
import { createValidator } from "express-joi-validation"
import { WalletController } from "../controllers/walletController"
import { ValidateGetWalletTrx } from "../lib/inputs"
import { authenticate } from "../middleware/auth"
const router = express.Router()

const validator = createValidator()
const controller = new WalletController()

router.route("/").get(authenticate, controller.myWallets)
router.route('/getAllWallets').get(controller.getWallets)
router
  .route("/trx")
  .post(
    authenticate,
    validator.body(ValidateGetWalletTrx),
    controller.getWalletTransactions
  )

export default {
  router,
  path: "wallet",
}