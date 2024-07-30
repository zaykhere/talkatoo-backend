const User = require("../models/User");
const generateToken = require("../config/generateToken");
const expressAsyncHandler = require("express-async-handler");
const cloudinary = require('cloudinary').v2;
const dotenv = require("dotenv");
const { default: uploadToCloudinary } = require("../utils/uploadToCloudinary");
const bcrypt = require("bcryptjs");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const registerUser = expressAsyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Fields");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  let imageUrl = '';

  if (req.files && req.files.pic) {
    const image = req.files.pic;

    // Check if the file is an image and if it is in jpg/jpeg or png format
    const allowedFormats = ['image/jpeg', 'image/png'];
    if (!allowedFormats.includes(image.mimetype)) {
      res.status(400);
      throw new Error("Only jpg and png allowed");
    }

    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'your_folder_name' }, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result.url);
          }
        }).end(image.data);
      });
    };

    try {
      imageUrl = await uploadToCloudinary();
    } catch (error) {
      res.status(500);
      throw new Error("Image upload failed");
    }
  }

  const userObj = {
    name,
    email,
    password,
    pic: imageUrl || undefined,
  };

  const user = await User.create(userObj);

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("User not found");
  }
});

const loginUser = expressAsyncHandler(async(req,res) => {
  const {email, password} = req.body;

  if(!email || !password) {
    res.status(400);
    throw new Error("Email and password is required");
  }

  const user = await User.findOne({email})
  if(!user) {
    res.status(400);
    throw new Error("Invalid Email or password");
  }

  const passwordMatched = await bcrypt.compare(password, user.password);
  if(!passwordMatched) {
    res.status(400);
    throw new Error("Invalid Email or password");
  }

  res.json({
    _id: user.id,
    name: user.name,
    email: user.email,
    pic: user.pic,
    token: generateToken(user._id)
  })

})

const allUsers = expressAsyncHandler(async(req,res) => {
  const keyword = req.query.search ? {
    $or: [
      {name: {$regex: req.query.search, $options: "i"}},
      {email: {$regex: req.query.search, $options: "i"}},
    ]
  } : {};

  const users = await User.find(keyword).find({_id: {$ne: req.user.id}}).select('-password');
  res.json(users);

})

module.exports = { registerUser, loginUser, allUsers }
