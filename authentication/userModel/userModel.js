import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
{
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  profile: {
    type: String,
    default: "https://res.cloudinary.com/dqwttbkqo/image/upload/v1756915925/user-png-33842_pbfgbn.png"
  },
  name: {
    type: String,
    required: true // Added required for name
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  grade: {
    type: Number,
    min: 9,
    max: 12
  },
  year : {
    type : String
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: Date
});

// Improved password comparison method
userSchema.methods.matchPasswords = async function (enteredPassword) {
    try {
        // Check if password exists
        if (!this.password) {
            console.error("Password is undefined for user:", this._id);
            return false;
        }
        
        // Check if entered password is provided
        if (!enteredPassword) {
            console.error("Entered password is undefined");
            return false;
        }
        
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        console.error("Error during password comparison:", error);
        return false;
    }
};

// Improved password hashing middleware
userSchema.pre('save', async function (next) {
    // Only hash the password if it's modified or new
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        // Check if password exists before hashing
        if (!this.password) {
            throw new Error('Password is required');
        }
        
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;