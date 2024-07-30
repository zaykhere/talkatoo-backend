const expressAsyncHandler = require("express-async-handler");
const Message = require("../models/Message");
const Chat = require("../models/Chat");

const sendMessage = expressAsyncHandler(async(req,res) => {
  const {content, chatId} = req.body;

  if(!content || !chatId) {
    res.status(400);
    throw new Error("Please input all fields")
  }

  let newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId
  };

  try {
    let message = await Message.create(newMessage);

    message = await (
      await message.populate("sender", "name pic")
    ).populate({
      path: "chat",
      select: "chatName isGroupChat users",
      model: "Chat",
      populate: { path: "users", select: "name email pic", model: "User" },
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message
    });

    res.json(message);

  } catch (error) {
    res.status(400);
    throw new Error(error.message)
  }

});

const allMessages = expressAsyncHandler(async(req,res) => {
  const messages = await Message.find({chat: req.params.chatId})
    .populate("sender", "name pic email")
    .populate("chat");

  res.json(messages);
})

module.exports = {sendMessage, allMessages};