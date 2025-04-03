import { Router } from "express";
import multer from "multer";
import { 
    createTask,
    completeTask,
    getAllTasks,
    deleteTask,
    getPendingTasksByUser
} from "../controllers/task.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
const upload = multer(); // Setup multer

// All routes are protected
router.use(verifyJWT);

// Get tasks with URL parameters
router.route("/group/:groupId").get(getAllTasks); // For tasks in a specific group
router.route("/group/:groupId/status/:status").get(getAllTasks); // For filtered tasks
router.route("/all").get(getAllTasks); // For all tasks

// Apply multer ONLY to createTask if it requires file uploads
router.route("/create").post(upload.any(), createTask);

router.route("/complete/:taskId").post(completeTask);
router.route("/:taskId").delete(deleteTask);

// New route to get pending tasks for the logged-in user
router.route("/user/pending").get(getPendingTasksByUser);

export default router;
