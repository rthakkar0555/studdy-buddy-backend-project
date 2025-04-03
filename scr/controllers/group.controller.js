import { Group } from "../models/group.models.js"
import { User } from "../models/user.models.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiRespons.js"
import asyncHandler from "../utils/asyncHandler.js"
import uploadOnCloudinary from "../utils/cloudinary.js"

const createGroup = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required")
    }

    // Upload group image if provided
    let groupImage
    if (req.file) {
        groupImage = await uploadOnCloudinary(req.file.path)
        if (!groupImage) {
            throw new ApiError(400, "Error uploading group image")
        }
    }

    const group = await Group.create({
        name,
        description,
        admin: req.user._id,
        members: [req.user._id],
        groupImage: groupImage?.url
    })

    const createdGroup = await Group.findById(group._id)
        .populate("admin", "username avatar")

    // Add group to user's groups
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet: { groups: group._id }
        }
    )

    return res.status(201).json(
        new ApiResponse(201, createdGroup, "Group created successfully")
    )
})

const getUserGroups = asyncHandler(async (req, res) => {
    const groups = await Group.find({ members: req.user._id })
        .populate("admin", "username avatar")
        .select("name description admin groupImage")
        .lean()

    // Add members count to each group
    const groupsWithCount = groups.map(group => ({
        ...group,
        membersCount: group.members?.length || 0
    }))

    return res.status(200).json(
        new ApiResponse(200, groupsWithCount, "Groups fetched successfully")
    )
})

const addMemberToGroup = asyncHandler(async (req, res) => {
    const { groupId, userId } = req.body

    // Validate input
    if (!groupId || !userId) {
        throw new ApiError(400, "Both groupId and userId are required")
    }

    // Check if group exists
    const group = await Group.findById(groupId)
    if (!group) {
        throw new ApiError(404, "Group not found")
    }

    // Check if user exists
    const userToAdd = await User.findById(userId)
    if (!userToAdd) {
        throw new ApiError(404, "User not found")
    }

    // Check if requester is admin
    if (group.admin.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only admin can add members")
    }

    // Check if user is already a member
    if (group.members.includes(userId)) {
        throw new ApiError(400, "User is already a member")
    }

    // Add user to group
    group.members.push(userId)
    await group.save()

    // Add group to user's groups
    await User.findByIdAndUpdate(userId, {
        $addToSet: { groups: groupId }
    })

    // Get updated group with populated fields
    const updatedGroup = await Group.findById(groupId)
        .populate("admin", "username avatar")
        .populate("members", "username avatar")

    return res.status(200).json(
        new ApiResponse(200, updatedGroup, "Member added successfully")
    )
})

// Get Group Details with Members
const getGroupDetails = asyncHandler(async (req, res) => {
    const { groupId } = req.params

    const group = await Group.findById(groupId)
        .populate("admin", "username avatar")
        .populate("members", "username avatar email")

    if (!group) {
        throw new ApiError(404, "Group not found")
    }

    // Check if user is a member
    if (!group.members.some(member => member._id.toString() === req.user._id.toString())) {
        throw new ApiError(403, "You are not a member of this group")
    }

    return res.status(200).json(
        new ApiResponse(200, group, "Group details fetched successfully")
    )
})

// Remove Member from Group
const removeMember = asyncHandler(async (req, res) => {
    const { groupId, memberId } = req.params

    const group = await Group.findById(groupId)
    if (!group) {
        throw new ApiError(404, "Group not found")
    }

    // Only admin can remove members
    if (group.admin.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only admin can remove members")
    }

    // Admin cannot be removed
    if (memberId === group.admin.toString()) {
        throw new ApiError(400, "Admin cannot be removed from the group")
    }

    // Check if user is a member
    if (!group.members.includes(memberId)) {
        throw new ApiError(404, "User is not a member of this group")
    }

    // Remove from group members
    group.members = group.members.filter(member => member.toString() !== memberId)
    await group.save()

    // Remove group from user's groups
    await User.findByIdAndUpdate(memberId, {
        $pull: { groups: groupId }
    })

    const updatedGroup = await Group.findById(groupId)
        .populate("admin", "username avatar")
        .populate("members", "username avatar")

    return res.status(200).json(
        new ApiResponse(200, updatedGroup, "Member removed successfully")
    )
})

const joinGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.body

    if (!groupId) {
        console.log(req.body,req.params)
        throw new ApiError(400, "Group ID is required")
    }

    // Check if group exists
    const group = await Group.findById(groupId)
    if (!group) {
        throw new ApiError(404, "Group not found")
    }

    // Check if user is already a member
    if (group.members.includes(req.user._id)) {
        throw new ApiError(400, "You are already a member of this group")
    }

    // Add user to group members
    group.members.push(req.user._id)
    await group.save()

    // Add group to user's groups
    await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { groups: groupId }
    })

    const updatedGroup = await Group.findById(groupId)
        .populate("admin", "username avatar")
        .populate("members", "username avatar")

    return res.status(200).json(
        new ApiResponse(200, updatedGroup, "Successfully joined the group")
    )
})

const deleteGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params; // Get groupId from URL parameters
    const userId = req.user._id; // Get the ID of the user making the request

    // Find the group to delete
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(404, "Group not found");
    }

    // Check if the user is the admin of the group
    if (group.admin.toString() !== userId.toString()) {
        throw new ApiError(403, "You do not have permission to delete this group");
    }

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Group deleted successfully")
    );
})

export {
    createGroup,
    getUserGroups,
    addMemberToGroup,
    getGroupDetails,
    removeMember,
    joinGroup,
    deleteGroup
} 