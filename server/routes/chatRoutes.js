import express from 'express';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

const router = express.Router();

// Get all chats for a user
router.get('/chats/:userEmail', async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.params.userEmail
    }).sort({ lastMessage: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new direct chat
router.post('/chats/direct', async (req, res) => {
  try {
    const { participant1, participant2 } = req.body;
    
    // Check if chat already exists
    const existingChat = await Chat.findOne({
      chatType: 'direct',
      participants: { $all: [participant1, participant2] }
    });

    if (existingChat) {
      return res.json(existingChat);
    }

    const chat = new Chat({
      chatType: 'direct',
      participants: [participant1, participant2]
    });

    const newChat = await chat.save();
    res.status(201).json(newChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create a new group chat
router.post('/chats/group', async (req, res) => {
  try {
    const { name, participants } = req.body;
    const chat = new Chat({
      chatType: 'group',
      name,
      participants
    });

    const newChat = await chat.save();
    res.status(201).json(newChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a group chat
router.delete('/chats/group/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userEmail } = req.query;

    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Verify that the user is a participant
    if (!chat.participants.includes(userEmail)) {
      return res.status(403).json({ message: 'Not authorized to delete this chat' });
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chatId });
    
    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update group members
router.put('/chats/group/:chatId/members', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userEmail, participants } = req.body;

    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Verify that the user is a participant
    if (!chat.participants.includes(userEmail)) {
      return res.status(403).json({ message: 'Not authorized to edit this chat' });
    }

    // Update participants
    chat.participants = participants;
    await chat.save();

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update group name
router.put('/chats/group/:chatId/name', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userEmail, name } = req.body;

    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Verify that the user is a participant
    if (!chat.participants.includes(userEmail)) {
      return res.status(403).json({ message: 'Not authorized to edit this chat' });
    }

    // Update name
    chat.name = name;
    await chat.save();

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a chat
router.get('/messages/:chatId', async (req, res) => {
  try {
    const messages = await Message.find({
      chatId: req.params.chatId
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a message
router.post('/messages', async (req, res) => {
  try {
    const { chatId, sender, content } = req.body;
    
    const message = new Message({
      chatId,
      sender,
      content,
      read: [sender]
    });

    const newMessage = await message.save();
    
    // Update last message timestamp in chat
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: new Date()
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark messages as read
router.put('/messages/read', async (req, res) => {
  try {
    const { chatId, userEmail } = req.body;
    
    await Message.updateMany(
      { 
        chatId,
        read: { $ne: userEmail }
      },
      {
        $addToSet: { read: userEmail }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 