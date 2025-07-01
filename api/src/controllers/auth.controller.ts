// api/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { User } from '../models/User.model';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth.middleware';

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });
};

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, companyName, companyDomain } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ error: 'Email already registered' });
        return;
      }

      // Create user
      const user = new User({
        email,
        password,
        company: {
          name: companyName,
          domain: companyDomain,
        },
      });

      await user.save();

      // Generate token
      const token = generateToken((user._id as any).toString());

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        user: {
          id: (user._id as any).toString(),
          email: user.email,
          company: user.company,
        },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate token
      const token = generateToken((user._id as any).toString());

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        user: {
          id: (user._id as any).toString(),
          email: user.email,
          company: user.company,
        },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  },

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    res.json({
      user: {
        id: (req.user._id as any).toString(),
        email: req.user.email,
        company: req.user.company,
      },
    });
  },

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const updates = req.body;
      delete updates.password; // Don't update password here

      const user = await User.findByIdAndUpdate(
        (req.user._id as any).toString(),
        { $set: updates },
        { new: true }
      ).select('-password');

      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },
};