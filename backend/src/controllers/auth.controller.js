import { generateToken } from '../lib/utils.js';
import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import cloudinary from '../lib/cloudinary.js';

// Add an email validating function here
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required"})
    }
    // password length check
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters"})
    }

    const user = await User.findOne({email})
    if (user) return res.status(400).json({message: "Email already exists"})

    //hash the pass
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // creating the user
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword
    })

    // generate JWT token here
    if (newUser) { // newUser is a newly created mongoDB document
      generateToken(newUser._id, res) // the res is so it can "send the cookie in the response"?

      await newUser.save();
      
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic
      })
    } else {
      res.status(400).json({message: "Invalid user data"});
    }
  } catch (error) {
    console.log("Error in the signup controller: ", error.message);
    res.status(500).json({ message: "Internal Server Error"})
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await User.findOne({email})

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials"})
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)

    if (!isPasswordCorrect) {
      return res.status(400).json({message: "Invalid credentials"})
    }

    generateToken(user._id, res) // the res is taken in order to store a cookie on your computer

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic
    })
  } catch (error) {
    console.log("Error in login controller: ", error.message);
    res.status(500).json({ message: "Internal server error"})
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", {maxAge:0})
    res.status(200).json({ message: "Logged out succesfully"})
  } catch (error) {
    console.log("Error in logout controller", error.message)
    res.status(500).json({ message: "Internal Server Error"})
  }
};

export const updateProfile = async (req, res) => { // find out where this is used
  try {
    const { profilePic } = req.body; // things being changed are usually in the body
    const userId = req.user._id // these statics things are in the req.user

    if(!profilePic) {
      return res.status(400).json({ message: "Profilie pic is required"})
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic) // this takes an iamge and returns an object with public_id, url and secure_url keys

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { profilePic: uploadResponse.secure_url }, // .secure_url ???
      { new: true } // gives you the latest object
    )  

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in 'update profile': ", error);
    res.status(500).json({ message: "Internal server error" })
  }
}

// We'll run this everytime we refresh
export const checkAuth = (req, res) => { // doesn't this do the same as the middleware?
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log('Error in checkAuth controller', error.message)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}