// routes/authRoutes.js (update your existing routes)
import express from 'express';
import {
    registerUser,
    login,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    validateResetToken,
    isUserLoggedIn
} from './userController.js';
import { authenticateUser } from '../../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/validate-reset-token', validateResetToken);
router.get('/is-user-logged-in', isUserLoggedIn);

// Protected routes
router.post("/change-password", authenticateUser, changePassword);
router.get('/logout', logout);

export default router;
