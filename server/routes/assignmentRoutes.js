import express from 'express';
import Assignment from '../models/Assignment.js';

const router = express.Router();

// Helper function to normalize date to UTC midnight
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// Get all assignments for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching assignments for user:', userId);
    
    const assignments = await Assignment.find({ userId })
      .sort({ dueDate: 1 });
    
    // Log each assignment's course name for debugging
    console.log('Found assignments:', assignments.map(a => ({
      id: a._id,
      courseName: a.courseName,
      assignmentName: a.assignmentName,
      dueDate: a.dueDate
    })));

    // Ensure dates are in UTC midnight
    const normalizedAssignments = assignments.map(assignment => ({
      ...assignment.toObject(),
      dueDate: normalizeDate(assignment.dueDate),
      createdAt: normalizeDate(assignment.createdAt)
    }));
    
    res.json(normalizedAssignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new assignment
router.post('/', async (req, res) => {
  console.log('Received POST request to /assignments');
  console.log('Request body:', req.body);
  
  try {
    // Validate required fields
    const { userId, courseName, assignmentName, dueDate } = req.body;
    if (!userId || !courseName || !assignmentName || !dueDate) {
      console.error('Missing required fields:', { userId, courseName, assignmentName, dueDate });
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['userId', 'courseName', 'assignmentName', 'dueDate'],
        received: req.body 
      });
    }

    // Normalize the date to UTC midnight
    const normalizedData = {
      ...req.body,
      dueDate: normalizeDate(dueDate)
    };

    const assignment = new Assignment(normalizedData);
    console.log('Created new assignment object:', assignment);
    
    await assignment.save();
    console.log('Assignment saved successfully:', assignment);
    
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors || {},
      receivedData: req.body
    });
  }
});

// Update assignment
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating assignment:', req.params.id);
    console.log('Update data:', req.body);

    // Normalize the date if it's being updated
    const updateData = {
      ...req.body,
      dueDate: req.body.dueDate ? normalizeDate(req.body.dueDate) : undefined
    };
    
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, userId: req.body.userId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!assignment) {
      console.log('Assignment not found or unauthorized');
      return res.status(404).json({ message: 'Assignment not found or unauthorized' });
    }
    
    console.log('Assignment updated successfully:', assignment);
    res.json(assignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete assignment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    console.log('Delete assignment request:', {
      assignmentId: id,
      userId: userId,
      query: req.query
    });

    if (!userId) {
      console.error('Missing userId in delete request');
      return res.status(400).json({ message: 'userId is required' });
    }
    
    const assignment = await Assignment.findOneAndDelete({
      _id: id,
      userId: userId
    });
    
    if (!assignment) {
      console.log('Assignment not found or unauthorized:', {
        assignmentId: id,
        userId: userId
      });
      return res.status(404).json({ message: 'Assignment not found or unauthorized' });
    }
    
    console.log('Assignment deleted successfully:', assignment);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      query: req.query
    });
    res.status(500).json({ message: error.message });
  }
});

export default router; 