// api/src/routes/userProfile.route.ts
import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { userProfileController } from "../controllers/UserProfileController";

const router = express.Router();

// Public routes (no authentication required)
router.get("/public-profiles", userProfileController.getPublicProfiles);
router.get("/public-profile/:id", userProfileController.getPublicProfile);

// Authenticated routes
router.use(authenticate);
router.get("/profile", userProfileController.getProfile);
router.put("/profile", userProfileController.updateProfile);
router.get("/profiles/search", userProfileController.searchProfiles);

export default router;
