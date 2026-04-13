import cloudinary from "../lib/cloudinary.js";
import { io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// Maximum base64 payload size: ~15MB (to allow for 10MB binary + base64 overhead)
const MAX_FILE_SIZE = 15 * 1024 * 1024;

// Allowed MIME types for file uploads
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

import { asyncHandler } from "../lib/asyncHandler.js";

export const getAllContacts = asyncHandler(async (req, res) => {
  const loggedInUserId = req.user._id;
  const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

  res.status(200).json(filteredUsers);
});

export const getMessagesByUserId = asyncHandler(async (req, res) => {
  const myId = req.user._id;
  const { id: userToChatId } = req.params;

  const messages = await Message.find({
    $or: [
      { senderId: myId, receiverId: userToChatId },
      { senderId: userToChatId, receiverId: myId },
    ],
  }).sort({ createdAt: 1 });

  res.status(200).json(messages);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { text, image, file, fileType, fileName } = req.body;
  const { id: receiverId } = req.params;
  const senderId = req.user._id;

  if (!text && !image && !file) {
    return res.status(400).json({ message: "Text, image, or file is required." });
  }
  if (senderId.equals(receiverId)) {
    return res.status(400).json({ message: "Cannot send messages to yourself." });
  }
  const receiverExists = await User.exists({ _id: receiverId });
  if (!receiverExists) {
    return res.status(404).json({ message: "Receiver not found." });
  }

  // Server-side file size validation
  if (image && Buffer.byteLength(image, "utf8") > MAX_FILE_SIZE) {
    return res.status(400).json({ message: "Image size must be less than 10MB." });
  }
  if (file && Buffer.byteLength(file, "utf8") > MAX_FILE_SIZE) {
    return res.status(400).json({ message: "File size must be less than 10MB." });
  }

  // File type validation
  if (fileType && !ALLOWED_FILE_TYPES.includes(fileType)) {
    return res.status(400).json({ message: "File type not allowed." });
  }

  let imageUrl;
  if (image) {
    const uploadResponse = await cloudinary.uploader.upload(image);
    imageUrl = uploadResponse.secure_url;
  }

  let uploadedFileUrl;
  if (file) {
    const uploadResponse = await cloudinary.uploader.upload(file, { 
      resource_type: "raw",
      public_id: fileName ? fileName : undefined
    });
    uploadedFileUrl = uploadResponse.secure_url;
  }

  const newMessage = new Message({
    senderId,
    receiverId,
    text: text?.trim(),
    image: imageUrl,
    fileUrl: uploadedFileUrl,
    fileType,
    fileName: fileName?.substring(0, 255),
  });

  await newMessage.save();

  // Send the new message to ALL tabs of the receiver using their personal room
  io.to(receiverId.toString()).emit("newMessage", newMessage);

  res.status(201).json(newMessage);
});

export const getChatPartners = asyncHandler(async (req, res) => {
  const loggedInUserId = req.user._id;

  // Use aggregation to efficiently find unique chat partner IDs
  const partnerIds = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
      },
    },
    {
      $project: {
        partnerId: {
          $cond: {
            if: { $eq: ["$senderId", loggedInUserId] },
            then: "$receiverId",
            else: "$senderId",
          },
        },
      },
    },
    { $group: { _id: "$partnerId" } },
  ]);

  const chatPartnerIds = partnerIds.map((p) => p._id);
  const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

  res.status(200).json(chatPartners);
});
