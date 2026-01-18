const User = require('../models/User');
const Farmer = require('../models/Farmer');
const { generateToken } = require('../middlewares/auth');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, role, location, language } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists',
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            phone,
            location,
            language: language || 'en',
            role: role || 'farmer',
        });

        // Note: Farmer profile can be created later via profile update

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    location: user.location,
                    language: user.language,
                    role: user.role,
                },
                token,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // Find user with password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Get farmer profile if exists
        let farmerProfile = null;
        if (user.role === 'farmer') {
            farmerProfile = await Farmer.findOne({ user: user._id });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    location: user.location,
                    language: user.language,
                    role: user.role,
                    avatar: user.avatar,
                },
                farmerProfile,
                token,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        let farmerProfile = null;

        if (user.role === 'farmer') {
            farmerProfile = await Farmer.findOne({ user: user._id }).populate('currentCrops.crop');
        }

        res.json({
            success: true,
            data: {
                user,
                farmerProfile,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, avatar, location, farmDetails } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, phone, avatar, location },
            { new: true, runValidators: true }
        );

        // Update farmer profile if exists
        if (user.role === 'farmer' && farmDetails) {
            await Farmer.findOneAndUpdate(
                { user: user._id },
                farmDetails,
                { new: true, upsert: true }
            );
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        next(error);
    }
};

// In-memory OTP storage (in production, use Redis or database)
const otpStore = new Map();

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email',
            });
        }

        // Generate OTP
        const { generateOTP, sendOTPEmail } = require('../utils/emailService');
        const otp = generateOTP();

        // Store OTP with expiry (10 minutes)
        otpStore.set(email, {
            otp,
            expiry: Date.now() + 10 * 60 * 1000,
            verified: false
        });

        // Send OTP email
        await sendOTPEmail(email, user.name, otp, 'password_change', 10);

        res.json({
            success: true,
            message: 'OTP sent to your email',
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        next(error);
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const storedData = otpStore.get(email);

        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: 'OTP expired or not found. Please request a new one.',
            });
        }

        if (Date.now() > storedData.expiry) {
            otpStore.delete(email);
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.',
            });
        }

        if (storedData.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP. Please try again.',
            });
        }

        // Mark OTP as verified
        storedData.verified = true;
        otpStore.set(email, storedData);

        res.json({
            success: true,
            message: 'OTP verified successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        const storedData = otpStore.get(email);

        if (!storedData || !storedData.verified) {
            return res.status(400).json({
                success: false,
                message: 'Please verify OTP first',
            });
        }

        if (storedData.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP',
            });
        }

        // Find and update user password
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        user.password = newPassword;
        await user.save();

        // Clear OTP
        otpStore.delete(email);

        res.json({
            success: true,
            message: 'Password reset successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    forgotPassword,
    verifyOTP,
    resetPassword,
};
