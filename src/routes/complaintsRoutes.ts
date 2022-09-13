import express from "express"
import { createValidator } from "express-joi-validation"
import { ComplaintController } from "../controllers/ComplaintsController"
import { ValidateComplaint } from "../lib/inputs"
import { authenticate, isAdmin } from "../middleware/auth"
const router = express.Router()

const validator = createValidator()
const controller = new ComplaintController()

router
  .route("/new")
  .post(validator.body(ValidateComplaint), controller.newComplaint)

router.route("/:id").post(authenticate, isAdmin, controller.resolveComplaint)

router.route("/").get(authenticate, isAdmin, controller.getUnresolvedComplaints)

export default {
  router,
  path: "complaints",
}
