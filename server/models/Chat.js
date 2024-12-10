import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  chatType: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  name: {
    type: String,
    required: function() {
      return this.chatType === 'group';
    }
  },
  participants: [{
    type: String,  // user emails
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Chat', chatSchema); 