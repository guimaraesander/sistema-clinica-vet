import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { uploadProductImage } from "../controllers/UploadController.js";

const router = express.Router();

router.post(
  "/products",
  protect,
  authorize("admin", "vendedor"),
  upload.single("image"),
  uploadProductImage
);

export default router;
