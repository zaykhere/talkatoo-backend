const dotenv = require("dotenv");
const expressAsyncHandler = require("express-async-handler");
const Chat = require("../models/Chat");
const User = require("../models/User");

dotenv.config();

const createGroupChat = expressAsyncHandler(async(req,res) => {
  if(!req.body.users || !req.body.name) {
    return res.status(400).send({message: 'Please fill all the fields'});
  }

  const users = JSON.parse(req.body.users);

  if(users.length < 2) {
    return res.status(400).send({message: 'More than 2 users are required for a group chat'});
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user
    });

    const fullGroupChat = await Chat.findOne({_id: groupChat._id})
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).send(fullGroupChat);

  } catch (error) {
    return res.status(500);
  }

})

const renameGroupChat = expressAsyncHandler(async(req,res) => {
  const {chatId, chatName} = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(chatId, {
    chatName
  }, {new: true})
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if(!updatedChat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  res.json(updatedChat);

})

const accessChat = expressAsyncHandler(async(req,res) => {
  const {userId} = req.body;

  if(!userId) {
    return res.status(400)
  }

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      {users: {$elemMatch: {$eq: req.user.id}}},
      {users: {$elemMatch: {$eq: userId}}},
    ]
  }).populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email"
  });

  if(isChat.length > 0) {
    return res.send(isChat[0]);
  }
  else {
    const chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId]
    }

    try {
      const createdChat = await Chat.create(chatData);

      const fullChat = await Chat.findOne({_id: createdChat._id}).populate("users", "-password");

      return res.status(200).send(fullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

const fetchChats = expressAsyncHandler(async(req,res) => {
  const chats = await Chat.find({users: {$elemMatch: {$eq: req.user.id}}})
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate({
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name pic email"
      }
    })
    .sort({updatedAt: -1});
  res.send(chats);
});

const addToGroup = expressAsyncHandler(async(req,res) => {
  const {chatId, userId} = req.body;

  const added = await Chat.findByIdAndUpdate(chatId, {
    $push: {users: userId},
  }, {new: true})
  .populate("users", "-password")
  .populate("groupAdmin", "-password");

  if(!added) {
    res.status(404);
    throw new Error("Chat not found");
  }

  res.json(added);

});

const removeFromGroup = expressAsyncHandler(async(req,res) => {
  const {chatId, userId} = req.body;

  const removed = await Chat.findByIdAndUpdate(chatId, {
    $pull: {users: userId},
  }, {new: true})
  .populate("users", "-password")
  .populate("groupAdmin", "-password");

  if(!removed) {
    res.status(404);
    throw new Error("Chat not found");
  }

  res.json(removed);

})

module.exports = { createGroupChat, renameGroupChat, accessChat, fetchChats, addToGroup, removeFromGroup}