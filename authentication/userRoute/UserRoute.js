import express from "express";
import jwt from "jsonwebtoken";
import asyncHandler from 'express-async-handler';
import User from '../userModel/userModel.js';
import dotenv from 'dotenv';

dotenv.config();
const userRoute = express.Router();

// Use environment variable with fallback
const TOKEN_SECRET = process.env.TOKEN_SECRET || "v9X#pL2@tQ8!zR6$wM1^gB7&dE3*hJ5%";

const genToken = (id) => {
    if (!TOKEN_SECRET) {
        throw new Error('TOKEN_SECRET not configured');
    }
    return jwt.sign({ id }, TOKEN_SECRET, {
        expiresIn: '7d'
    });
};

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    let responseSent = false;
    const duration = 3000;

    const timeOut = setTimeout(() => {
        if (!responseSent) {
            responseSent = true;
            res.status(504).json({ message: 'Login timeout' });
        }
    }, duration);

    try {
        // Find user and explicitly select password field
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            clearTimeout(timeOut);
            responseSent = true;
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user has password
        if (!user.password) {
            clearTimeout(timeOut);
            responseSent = true;
            return res.status(500).json({ message: 'Server configuration error' });
        }

        // Verify password
        const isPasswordValid = await user.matchPasswords(password);
        
        if (!isPasswordValid) {
            clearTimeout(timeOut);
            responseSent = true;
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Update last active
        user.lastActive = new Date();
        await user.save();

        // Generate token
        const token = genToken(user._id);

        if (!responseSent) {
            clearTimeout(timeOut);
            responseSent = true;
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                grade: user.grade,
                profile: user.profile,
                role: user.role,
                token: token
            });
        }

    } catch (error) {
        clearTimeout(timeOut);
        if (!responseSent) {
            responseSent = true;
            console.error('Login error:', error);
            res.status(500).json({ message: 'Server error during login' });
        }
    }
});

// Fixed registerUser function
const registerUser = asyncHandler(async (req, res) => {
    const { name, phone, grade, email, password , year } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Check if phone already exists
        const phoneExists = await User.findOne({ phone });
        if (phoneExists) {
            return res.status(400).json({ message: 'Phone number already registered' });
        }

        const user = await User.create({ 
            name, 
            phone, 
            grade, 
            email, 
            password , 
           year
        });

        const token = genToken(user._id);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            profile: user.profile, // Fixed typo: was user.profie
            grade: user.grade,
            email: user.email,
            phone: user.phone,
            year : user?.year ,
            role: user.role,
            token: token
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                message: `${field} already exists` 
            });
        }

        res.status(500).json({
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Fixed editProfile function
const editProfile = asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;

    try {
        // You need to implement authentication middleware to set req.user
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Check if phone is being changed and if it's already taken
        if (phone && phone !== user.phone) {
            const phoneExists = await User.findOne({ phone });
            if (phoneExists) {
                return res.status(400).json({ message: 'Phone number already in use' });
            }
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;

        const updatedUser = await user.save();

        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            profile: updatedUser.profile
        });

    } catch (error) {
        console.error('Edit profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

const editUserDetails = asyncHandler(async (req, res) => {
    const { userId, name, email, phone } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check for duplicate email
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email, _id: { $ne: userId } });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Check for duplicate phone
        if (phone && phone !== user.phone) {
            const phoneExists = await User.findOne({ phone, _id: { $ne: userId } });
            if (phoneExists) {
                return res.status(400).json({ message: 'Phone number already in use' });
            }
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;

        const updatedUser = await user.save();
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user details:', error);
        res.status(500).json({ message: 'Failed to update user details', error: error.message });
    }
});

const updateProfilePicture = asyncHandler(async (req, res) => {
    try {
        const { userId, profilePicture } = req.body; // Changed from profile to profilePicture
        
        if (!userId || !profilePicture) {
            return res.status(400).json({ message: 'User ID and profile picture are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.profile = profilePicture;
        await user.save();

        res.status(200).json({
            message: 'Profile picture updated successfully',
            profile: user.profile
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ 
            message: 'Failed to update profile picture',
            error: error.message 
        });
    }
});

// Password reset functions (you'll need to implement sendPasswordReset)
const otpStore = new Map();

const passwordResetRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists or not for security
            return res.status(200).json({ 
                message: 'If the email exists, a recovery code has been sent' 
            });
        }

        const OTP = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(email, {
            otp: OTP,
            expiresAt: Date.now() + 300000 // 5 minutes
        });

        // TODO: Implement sendPasswordReset function
        // await sendPasswordReset({ email: user.email, name: user.name, OTP: OTP });
        
        console.log(`OTP for ${email}: ${OTP}`); // Remove this in production

        res.status(200).json({ 
            message: 'If the email exists, a recovery code has been sent' 
        });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    try {
        const otpData = otpStore.get(email);

        if (!otpData || otpData.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (Date.now() > otpData.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ message: 'OTP has expired' });
        }

        const token = jwt.sign(
            { id: email }, 
            TOKEN_SECRET, // Use the same TOKEN_SECRET
            { expiresIn: '15m' }
        );

        otpStore.delete(email);
        res.status(200).json({ token });

    } catch (error) {
        console.error('Error during OTP verification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const passwordReset = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    try {
        const decoded = jwt.verify(token, TOKEN_SECRET); // Use the same TOKEN_SECRET
        const user = await User.findOne({ email: decoded.id });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password has been successfully updated' });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(401).json({ message: 'Password reset failed. Token may be invalid or expired.' });
    }
});

// Routes
userRoute.route('/login').post(loginUser);
userRoute.route('/register').post(registerUser);
userRoute.route('/profilepicture').put(updateProfilePicture);
userRoute.route('/password-reset-request').post(passwordResetRequest);
userRoute.route('/verify-otp').post(verifyOTP);
userRoute.route('/password-reset').post(passwordReset);
userRoute.route('/editUserDetails').put(editUserDetails);
userRoute.route('/editProfile').put(editProfile);

export default userRoute;