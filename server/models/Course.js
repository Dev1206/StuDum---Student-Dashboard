import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  courseName: {
    type: String,
    required: true
  },
  courseCode: {
    type: String,
    required: true
  },
  instructor: {
    type: String,
    required: true
  },
  schedule: String,
  description: String,
  color: {
    type: String,
    default: '#4CAF50'
  }
}, {
  timestamps: true
});

// Create compound index for faster queries
courseSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Course', courseSchema);
