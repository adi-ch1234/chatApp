import express from "express";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { validateObjectId, sanitizeBody } from "../middleware/validation.middleware.js";

const router = express.Router();

// Rate-limit first, then authenticate, then sanitize input
router.use(arcjetProtection, protectRoute, sanitizeBody);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/:id", validateObjectId("id"), getMessagesByUserId);
router.post("/send/:id", validateObjectId("id"), sendMessage);

export default router;
