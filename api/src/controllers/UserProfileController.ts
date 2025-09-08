// api/src/controllers/userProfile.controller.ts
import { Request, Response } from "express";
import { User } from "../models/User.model";
import { AuthRequest } from "../middleware/auth.middleware";

export const userProfileController = {
  // GET /api/user/public-profiles
  async getPublicProfiles(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 50, offset = 0, role } = req.query;

      const filter: any = {
        profileRole: {
          $exists: true,
          $nin: [null, ""],
        },
      };

      if (role && typeof role === "string") {
        filter.profileRole = { $regex: role, $options: "i" };
      }

      const users = await User.find(filter)
        .select("firstName lastName email phone profileRole avatarUrl")
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({ firstName: 1, lastName: 1 });

      const total = await User.countDocuments(filter);

      const profiles = users.map((user) => ({
        id: user._id.toString(),
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email,
        phone: user.phone || null,
        profileRole: user.profileRole || "",
        avatarUrl: user.avatarUrl || null,
      }));

      res.json({
        profiles,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + profiles.length < total,
        },
      });
    } catch (error: any) {
      console.error("Error fetching public profiles:", error);
      res.status(500).json({ error: "Failed to fetch public profiles" });
    }
  },

  // GET /api/user/public-profile/:id
  async getPublicProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        res.status(400).json({ error: "Invalid profile ID" });
        return;
      }

      const user = await User.findById(id).select(
        "firstName lastName email phone profileRole avatarUrl"
      );

      if (!user || !user.profileRole) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      const profile = {
        id: user._id.toString(),
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email,
        phone: user.phone || null,
        profileRole: user.profileRole,
        avatarUrl: user.avatarUrl || null,
      };

      res.json(profile);
    } catch (error: any) {
      console.error("Error fetching public profile:", error);
      res.status(500).json({ error: "Failed to fetch public profile" });
    }
  },

  // GET /api/user/profile
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const user = await User.findById(req.user._id).select("-password");

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ success: true, user });
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  },

  // PUT /api/user/profile
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const allowedUpdates = ["firstName", "lastName", "phone", "profileRole"];
      const updates: any = {};

      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (req.body.removeAvatar === "true") {
        updates.avatarUrl = null;
      } else if (req.file) {
        updates.avatarUrl = req.file.path;
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        success: true,
        user,
        message: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating user profile:", error);

      if (error.name === "ValidationError") {
        res.status(400).json({
          error: "Validation failed",
          details: Object.values(error.errors).map((err: any) => err.message),
        });
      } else {
        res.status(500).json({ error: "Failed to update profile" });
      }
    }
  },

  // GET /api/user/profiles/search
  async searchProfiles(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const { q, role, limit = 20 } = req.query;

      if (!q || typeof q !== "string") {
        res.status(400).json({ error: "Search query is required" });
        return;
      }

      const filter: any = {
        profileRole: {
          $exists: true,
          $nin: [null, ""],
        },
        $or: [
          { firstName: { $regex: q, $options: "i" } },
          { lastName: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { profileRole: { $regex: q, $options: "i" } },
        ],
      };

      if (role && typeof role === "string") {
        filter.profileRole = { $regex: role, $options: "i" };
      }

      const users = await User.find(filter)
        .select("firstName lastName email phone profileRole avatarUrl")
        .limit(Number(limit))
        .sort({ firstName: 1, lastName: 1 });

      const profiles = users.map((user) => ({
        id: user._id.toString(),
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email,
        phone: user.phone || null,
        profileRole: user.profileRole || "",
        avatarUrl: user.avatarUrl || null,
      }));

      res.json({ success: true, profiles, total: profiles.length });
    } catch (error: any) {
      console.error("Error searching profiles:", error);
      res.status(500).json({ error: "Failed to search profiles" });
    }
  },
};
