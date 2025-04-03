import { Message } from "../models/message.models.js"
import { Group } from "../models/group.models.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiRespons.js"
import asyncHandler from "../utils/asyncHandler.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import { getIO } from "../services/socket.service.js"

const sendMessage = asyncHandler(async (req, res) => {
    const { content } = req.body; // Get content from body
    const groupId = req.params.groupId; // Get groupId from URL parameters
    const sender = req.user._id;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(404, "Group not found");
    }
    
    if (!group.members.includes(sender)) {
        throw new ApiError(403, "You are not a member of this group");
    }

    // Handle file attachments if any
    let attachments = [];
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            const cloudinaryUrl = await uploadOnCloudinary(file.path);
            if (cloudinaryUrl) {
                attachments.push(cloudinaryUrl.url);
            }
        }
    }

    const message = await Message.create({
        sender,
        group: groupId,
        content,
        attachments,
        readBy: [sender]
    });

    const populatedMessage = await Message.findById(message._id)
        .populate("sender", "username avatar");

    // Emit the new message to the group
    const io = getIO();
    io.to(groupId).emit("receive_message", populatedMessage);

    return res.status(201).json(
        new ApiResponse(201, populatedMessage, "Message sent successfully")
    );
})

const getGroupMessages = asyncHandler(async (req, res) => {
    const { groupId } = req.params
    const { page = 1, limit = 50 } = req.query

    const group = await Group.findById(groupId)
    if (!group) {
        throw new ApiError(404, "Group not found")
    }

    if (!group.members.includes(req.user._id)) {
        throw new ApiError(403, "You are not a member of this group")
    }

    const messages = await Message.find({ group: groupId })
        .populate("sender", "username avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)

    // Mark messages as read
    await Message.updateMany(
        {
            group: groupId,
            readBy: { $ne: req.user._id }
        },
        {
            $addToSet: { readBy: req.user._id }
        }
    )

    return res.status(200).json(
        new ApiResponse(200, messages, "Messages retrieved successfully")
    )
})

const getUnreadMessageCount = asyncHandler(async (req, res) => {
    const { groupId } = req.params

    const unreadCount = await Message.countDocuments({
        group: groupId,
        readBy: { $ne: req.user._id }
    })

    return res.status(200).json(
        new ApiResponse(200, { unreadCount }, "Unread count retrieved successfully")
    )
})

const typingStatus = asyncHandler(async (req, res) => {
    const { groupId } = req.params; // Get groupId from URL parameters
    const { username } = req.body; // Get username from request body

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(404, "Group not found");
    }

    // Emit typing status to the group
    const io = getIO();
    io.to(groupId).emit("user_typing", { username });

    return res.status(200).json(
        new ApiResponse(200, {}, "Typing status sent successfully")
    );
});

const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params; // Get messageId from URL parameters
    const sender = req.user._id; // Get the ID of the user making the request

    // Find the message to delete
    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    // Check if the user is the sender of the message or an admin of the group
    const group = await Group.findById(message.group);
    if (!group) {
        throw new ApiError(404, "Group not found");
    }

    const isSender = message.sender.toString() === sender.toString();
    const isAdmin = group.admin.toString() === sender.toString();

    if (!isSender && !isAdmin) {
        throw new ApiError(403, "You do not have permission to delete this message");
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    // Emit a message deletion event to the group (optional)
    const io = getIO();
    io.to(message.group).emit("message_deleted", { messageId });

    return res.status(200).json(
        new ApiResponse(200, {}, "Message deleted successfully")
    );
});

export {
    sendMessage,
    getGroupMessages,
    getUnreadMessageCount,
    typingStatus,
    deleteMessage
} 