import { Router } from "express"
import { 
    createGroup,
    getUserGroups,
    addMemberToGroup,
    getGroupDetails,
    removeMember,
    joinGroup,
    deleteGroup
} from "../controllers/group.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

// All routes are protected
router.use(verifyJWT)

router.route("/create").post(
    upload.single("groupImage"),
    createGroup
)

router.route("/my").get(getUserGroups)
router.route("/join").post(joinGroup)
router.route("/add-member").post(addMemberToGroup)

// New routes
router.route("/:groupId").get(getGroupDetails).delete(deleteGroup)
router.route("/:groupId/members/:memberId").delete(removeMember)

export default router 