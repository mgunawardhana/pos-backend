const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /.+\@.+\..+/,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'root', 'staff'],
    },
    phone: {
      type: String,
      required: true,
      match: /^\d{10}$/,
    },
    address: {
      type: String,
      required: false,
    },
    dob: {
      type: String,
      required: false,
      match: /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(19|20)\d\d$/,
    },
    mobile: {
      type: String,
      required: false,
      match: /^\d{10}$/,
    },
    profilePicture: {
      type: String,
      required: false,
    }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
