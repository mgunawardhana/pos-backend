const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        require('dotenv').config();

        exports.register = async (req, res) => {
            const {
                firstName,
                lastName,
                email,
                password,
                role,
                phone,
                address,
                profilePicture,
            } = req.body;

            try {
                let user = await User.findOne({ email });
                if (user) {
                    return res.status(400).json({ message: 'User already exists' });
                }

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                user = new User({
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                    role,
                    phone,
                    address,
                    profilePicture,
                });

                await user.save();

                const payload = { userId: user._id };
              const jwt_sec = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
                const accessToken = jwt.sign(payload, jwt_sec, { expiresIn: '1h' });

                res.status(201).json({
                    accessToken,
                    user: {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        profilePicture: user.profilePicture,
                    },
                });
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        };

        exports.login = async (req, res) => {
            const { email, password } = req.body;

            try {
                const user = await User.findOne({ email });
                if (!user) {
                    return res.status(400).json({ message: 'Invalid credentials' });
                }

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(400).json({ message: 'Invalid credentials' });
                }

                const payload = { userId: user._id };
              const jwt_sec = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
                const accessToken = jwt.sign(payload, jwt_sec, { expiresIn: '48h' });

                res.json({
                    accessToken,
                    user: {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        profilePicture: user.profilePicture,
                    },
                });
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        };