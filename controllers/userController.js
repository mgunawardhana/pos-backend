const User = require('../models/User');
const mongoose = require('mongoose');


// Get paginated users
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 10;
        const skip = (page - 1) * size;

        const users = await User.find({}, '-password')
            .skip(skip)
            .limit(size);

        const totalUsers = await User.countDocuments();
        const totalPages = Math.ceil(totalUsers / size);

        res.json({
            users,
            pagination: {
                currentPage: page,
                totalPages,
                totalUsers,
                size,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
        res.status(400).json({ message: 'Invalid data' });
    }
};


// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id, '-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        if (req.body.password) delete req.body.password; // Prevent password update here
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
            select: '-password'
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Invalid data' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent self-deletion (optional)
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Prevent deletion of root users (optional)
    if (user.role === 'root') {
      return res.status(403).json({ message: 'Cannot delete root user' });
    }

    // Check if user has related data (optional - check sales, etc.)
    // const hasRelatedData = await Sales.findOne({ 'orders.demonstratorName': user.firstName + ' ' + user.lastName });
    // if (hasRelatedData) {
    //     return res.status(400).json({ message: 'Cannot delete user with existing sales records' });
    // }

    // Soft delete option (mark as inactive instead of actual deletion)
    // await User.findByIdAndUpdate(userId, { isActive: false });

    // Hard delete (current implementation)
    await User.findByIdAndDelete(userId);

    // Log the deletion (optional)
    console.log(`User ${user.email} deleted by ${req.user.userId} at ${new Date()}`);

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};