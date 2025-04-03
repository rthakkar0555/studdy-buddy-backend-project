import { Router } from "express"
import { 
    sendMessage, 
    getGroupMessages, 
    getUnreadMessageCount, 
    typingStatus,
    deleteMessage
} from "../controllers/chat.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

// All routes are protected
router.use(verifyJWT)

router.route("/group/:groupId")
    .get(getGroupMessages)
    .post(upload.array("attachments"), sendMessage)

router.route("/group/:groupId/unread")
    .get(getUnreadMessageCount)

router.route("/group/:groupId/typing")
    .post(typingStatus)

router.route("/message/:messageId").delete(deleteMessage)

export default router 