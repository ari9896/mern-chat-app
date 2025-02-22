import User from "../models/user.model.js";
import Message from '../models/message.model.js';

import cloudinary from '../lib/cloudinary.js'
import { getReceiverSocketId, io } from '../lib/socket.js'

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({ _id: {$ne: loggedInUserId }}).select('-password'); // selects all users who are not the ones who have your user id minus the password

    res.status(200).json(filteredUsers); // the data will be sent back as json

  } catch (error) {
    console.error('Error in getUsersForSidebar: ', error.message);
    res.status(500).json({ error: 'Internal server error '})
  }
};

export const getMessages = async (req, res) => { // I don't quite get this one yet 
  try { 
    // find out where req.params comes from and how it's generated.
    const { id: userToChatId } = req.params; // comes from /api/messages/:id
    const myId = req.user._id;

    const messages = await Message.find({ 
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId }
      ]
    })

    res.status(200).json(messages)
  } catch (error) {
    console.log('Error in getMessages controller: ', error.message);
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id
    
    let imageUrl;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl
    })

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId); // from params
    if(receiverSocketId) { // if user is online
      io.to(receiverSocketId).emit('newMessage', newMessage);
    }

    //todo: realtime funtionality goes here
    res.status(200).json(newMessage)
  } catch (error) {
    console.log('Error in sendMessage controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' })
  }
}