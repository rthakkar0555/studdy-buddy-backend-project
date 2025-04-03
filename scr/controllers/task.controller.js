import { Task } from "../models/task.models.js"
import { Group } from "../models/group.models.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiRespons.js"
import asyncHandler from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"

const createTask = asyncHandler(async (req, res) => {
    const { title, description, groupId, dueDate, points } = req.body

    console.dir(req.body) // Debugging line to check incoming data

    if (!title || !description || !groupId || !dueDate) {
        throw new ApiError(400, "All required fields must be provided")
    }

    // Check if group exists and user is a member
    const group = await Group.findById(groupId)
    if (!group) {
        throw new ApiError(404, "Group not found")
    }

    if (!group.members.includes(req.user._id)) {
        throw new ApiError(403, "You are not a member of this group")
    }

    const task = await Task.create({
        title,
        description,
        group: groupId,
        createdBy: req.user._id,
        dueDate: new Date(dueDate),
        points: points || 10,
        completedBy: [] // Initialize empty completedBy array
    })

    const createdTask = await Task.findById(task._id)
        .populate("createdBy", "username")
        .populate("group", "name")
        .populate("completedBy.user", "username avatar")

    return res.status(201).json(
        new ApiResponse(201, createdTask, "Task created successfully")
    )
})

// New function to mark task as completed by a user
const completeTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params

    const task = await Task.findById(taskId)
    if (!task) {
        throw new ApiError(404, "Task not found")
    }

    // Check if user is in the group
    const group = await Group.findById(task.group)
    if (!group.members.includes(req.user._id)) {
        throw new ApiError(403, "You are not a member of this group")
    }

    // Check if user has already completed the task
    if (task.completedBy.some(completion => completion.user.toString() === req.user._id.toString())) {
        throw new ApiError(400, "You have already completed this task")
    }

    // Add user to completedBy array
    task.completedBy.push({
        user: req.user._id,
        completedAt: new Date()
    })

    // If all group members have completed, mark task as completed
    if (task.completedBy.length === group.members.length) {
        task.status = "completed"
    }

    await task.save()

    const updatedTask = await Task.findById(taskId)
        .populate("createdBy", "username")
        .populate("group", "name")
        .populate("completedBy.user", "username avatar")

    return res.status(200).json(
        new ApiResponse(200, updatedTask, "Task marked as completed")
    )
})

const getAllTasks = asyncHandler(async (req, res) => {
    // Get filters from params
    const { groupId, status } = req.params
    console.log("Get Tasks Request:", {
        params: req.params,
        groupId,
        status
    })

    const filter = {}
    
    if (groupId) filter.group = groupId
    if (status) filter.status = status

    // Ensure user is member of the group if groupId is provided
    if (groupId) {
        const group = await Group.findById(groupId)
        if (!group) {
            throw new ApiError(404, "Group not found")
        }
        if (!group.members.includes(req.user._id)) {
            throw new ApiError(403, "You are not a member of this group")
        }
    }

    const tasks = await Task.find(filter)
        .populate("createdBy", "username")
        .populate("group", "name")
        .populate("completedBy.user", "username avatar")
        .sort("-createdAt")

    return res.status(200).json(
        new ApiResponse(200, tasks, "Tasks fetched successfully")
    )
})

const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params

    const task = await Task.findById(taskId)
    if (!task) {
        throw new ApiError(404, "Task not found")
    }

    // Get the group to check if user is admin
    const group = await Group.findById(task.group)
    if (!group) {
        throw new ApiError(404, "Group not found")
    }

    // Allow deletion if user is either task creator or group admin
    const isCreator = task.createdBy.toString() === req.user._id.toString()
    const isGroupAdmin = group.admin.toString() === req.user._id.toString()

    if (!isCreator && !isGroupAdmin) {
        throw new ApiError(403, "Only task creator or group admin can delete tasks")
    }

    await Task.findByIdAndDelete(taskId)

    return res.status(200).json(
        new ApiResponse(
            200, 
            { deletedTask: task },
            "Task deleted successfully"
        )
    )
})

// New function to get all pending tasks for the logged-in user
const getPendingTasksByUser = asyncHandler(async (req, res) => {
    // Get the access token from cookies
    const token = req.cookies.accessToken;

    if (!token) {
        throw new ApiError(401, "Access token is required");
    }

    // Verify and decode the token to get the user ID
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid access token");
    }

    const userId = decoded._id; // Extract user ID from the decoded token

    // Find all groups where the user is a member
    const groups = await Group.find({ members: userId }).select("_id");

    if (groups.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No groups found for this user"));
    }

    // Get all pending tasks from those groups
    const tasks = await Task.find({
        group: { $in: groups.map(group => group._id) },
        status: "pending"
    })
    .populate("createdBy", "username")
    .populate("group", "name");

    return res.status(200).json(
        new ApiResponse(200, tasks, "Pending tasks fetched successfully")
    );
})

export {
    createTask,
    completeTask,
    getAllTasks,
    deleteTask,
    getPendingTasksByUser
} 