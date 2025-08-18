const { User } = require('../model/model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register user logic
exports.registerAdmin = async (req, res) => {
    const { name, email, password, secretKey, role } = req.body;
    const prefix = `${role}.`;
    const prefixedEmail = `${prefix}${email.trim().toLowerCase()}`;
    try {
        // Check if the secret key matches
        if (secretKey !== process.env.secretKey) {
            return res.json({ message: 'Unauthorized Account Creation' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: prefixedEmail });
        if (existingUser) {
            return res.json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name,
            email: prefixedEmail,
            password: hashedPassword,
            isActive: true,
            worker: null,
            client: null,
            status: '',
            role: 'admin',
            last_active: null // Initialize last_active
        });

        // Save the user to the database
        await newUser.save();

        res.status(201).json({ message: 'Admin registered successfully', newUser });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Login user logic
exports.loginAdmin = async (req, res) => {
    const { email, password, role } = req.body;
    try {
        // Find user by email
        const prefix = `${role}.`;
        const prefixedEmail = `${prefix.trim().toLowerCase()}${email.trim().toLowerCase()}`;
        const user = await User.findOne({ email: prefixedEmail });
        if (!user) {
            return res.json({ message: 'Invalid Credentials... Please try again' });
        }
        // if (!user.isActive) {
        //     return res.status(403).json({ message: 'Account is deactivated!!!' });
        // }

        // Check if the password is correct
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.json({ message: 'Invalid Credentials... Please try again' });
        }

        // Update last_active timestamp
        user.last_active = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '3000h' });

        
        // Return user data excluding password
        res.status(200).json({
            message: 'Login successful',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                last_active: user.last_active
            },
            token: token
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all users logic
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get user by ID logic
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update user logic
exports.updateUser = async (req, res) => {
    const updatedData = req.body;
    try {
        // Find user by ID
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.json({ message: 'User not found' });
        }

        // Update last_active timestamp
        updatedData.last_active = new Date();

        // Hash the new password if provided
        if (updatedData.password) {
            updatedData.password = await bcrypt.hash(updatedData.password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedData, { new: true }).select('-password');
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Deactivate user logic
exports.deactivateUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Find user by ID
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Deactivate user
        user.isActive = false;
        user.last_active = new Date(); // Update last_active on deactivation
        await user.save();
        res.status(200).json({ message: 'User deactivated successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user activity status
exports.getUserActivityStatus = async (req, res) => {
    const { id } = req.params;
    try {
        // Find user by ID
        const user = await User.findById(id).select('last_active');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const lastActive = user.last_active;

        if (!lastActive) {
            return res.status(200).json({ user_id: id, status: 'No activity recorded' });
        }

        // Check if user is "online" (active within last 5 minutes)
        const now = new Date();
        const lastActiveDate = new Date(lastActive);
        const timeDiff = (now - lastActiveDate) / 1000 / 60; // Difference in minutes

        if (timeDiff <= 5) {
            return res.status(200).json({ user_id: id, status: 'online', last_active: lastActive });
        }

        return res.status(200).json({ user_id: id, status: 'offline', last_active: lastActive });
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ message: error.message });
    }
};
