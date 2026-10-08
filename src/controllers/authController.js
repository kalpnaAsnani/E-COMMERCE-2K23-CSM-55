/**
 * Authentication Controller
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const config = require('../config/env');

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'ValidationFailed',
          message: 'Both email and password are required.'
        });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'AuthenticationFailed',
          message: 'Invalid email or password credentials.'
        });
      }

      const isMatch = await UserModel.verifyPassword(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'AuthenticationFailed',
          message: 'Invalid email or password credentials.'
        });
      }

      // Generate signed JWT token
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      };

      const token = jwt.sign(tokenPayload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN
      });

      return res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, role = 'customer' } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: 'ValidationFailed',
          message: 'Email, password, firstName, and lastName are required.'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'ValidationFailed',
          message: 'Password must be at least 6 characters long.'
        });
      }

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'ConflictDuplicateResource',
          message: 'A user with this email address already exists.'
        });
      }

      // Default registration creates customer role unless explicitly requested during dev
      const assignedRole = role === 'admin' ? 'admin' : 'customer';

      const newUser = await UserModel.create({
        email,
        password,
        firstName,
        lastName,
        role: assignedRole
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: {
          user: newUser
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'ResourceNotFound',
          message: 'User account not found.'
        });
      }
      return res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
