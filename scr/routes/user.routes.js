import { Router } from "express"
import { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

// Public routes
router.route("/register").post(
    upload.single("avatar"),
    registerUser
)

router.route("/login").post(
    upload.none(), // This should be fine for JSON requests
    loginUser
)

router.route("/refresh-token").post(refreshAccessToken)

// Protected routes
router.route("/logout").post(verifyJWT, logoutUser)

export default router 