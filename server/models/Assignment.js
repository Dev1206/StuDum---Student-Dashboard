import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  assignmentName: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true,
    set: function(date) {
      // Ensure the date is set to midnight UTC
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Submitted', 'Completed', 'Graded'],
    default: 'Pending'
  },
  marks: {
    type: String,
    default: 'N/A'
  },
  createdAt: {
    type: Date,
    default: () => {
      const now = new Date();
      now.setUTCHours(0, 0, 0, 0);
      return now;
    }
  }
});

// Add a pre-save middleware to ensure dates are in UTC
assignmentSchema.pre('save', function(next) {
  if (this.dueDate) {
    const d = new Date(this.dueDate);
    d.setUTCHours(0, 0, 0, 0);
    this.dueDate = d;
  }
  next();
});

export default mongoose.model('Assignment', assignmentSchema); 