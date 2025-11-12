const Category = require('../models/Category');
const mongoose = require('mongoose');

exports.getCategories = async (req, res) => {
    try {
        const page = parseInt(req.params.page) || 1;
        const size = parseInt(req.params.size) || 10;

        const skip = (page - 1) * size;

        const categories = await Category.find()
            .skip(skip)
            .limit(size);

        const totalCategories = await Category.countDocuments();

        const totalPages = Math.ceil(totalCategories / size);

        console.info(`Fetched categories for page ${page}, size ${size}`);

        res.json({
            categories,
            pagination: {
                currentPage: page,
                totalPages,
                totalCategories,
                size,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const category = new Category({
            ...req.body,
            createdBy: req.body.createdBy || req.user.name || req.user._id.toString() // Using the provided createdBy or fallback to user name/id
        });
        await category.save();
        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(400).json({ message: 'Invalid data', error: error.message });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        // Check if ID is valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid category ID format' });
        }

        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        // Check if ID is valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid category ID format' });
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body
            },
            { new: true }
        );

        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(400).json({ message: 'Invalid data', error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        // Check if ID is valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid category ID format' });
        }

        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};