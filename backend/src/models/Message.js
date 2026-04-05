import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^https:\/\/.+/.test(v);
        },
        message: "Image URL must be HTTPS",
      },
    },
    fileUrl: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^https:\/\/.+/.test(v);
        },
        message: "File URL must be HTTPS",
      },
    },
    fileType: {
      type: String,
      maxlength: 100,
    },
    fileName: {
      type: String,
      maxlength: 255,
    },
  },
  { timestamps: true }
);

// Compound index for efficient message queries between two users
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
