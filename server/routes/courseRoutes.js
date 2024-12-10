import express from 'express';
import Course from '../models/Course.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get course details (this must come before the userId route)
router.get('/details/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    console.log('Received request for course details:', courseId);

    // Validate courseId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log('Invalid course ID format:', courseId);
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    console.log('Fetching course details from database...');
    const course = await Course.findById(courseId);

    if (!course) {
      console.log('Course not found:', courseId);
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('Found course:', course);
    res.json(course);
  } catch (error) {
    console.error('Error fetching course details:', error);
    res.status(500).json({ 
      message: 'Error fetching course details',
      error: error.message 
    });
  }
});

// Get all courses for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching courses for user:', userId);

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const courses = await Course.find({ userId }).sort({ createdAt: -1 });
    console.log(`Found ${courses.length} courses for user:`, userId);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ 
      message: 'Error fetching courses',
      error: error.message 
    });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('Creating new course:', req.body);
    
    // Validate required fields
    const { userId, courseName, courseCode, instructor } = req.body;
    if (!userId || !courseName || !courseCode || !instructor) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['userId', 'courseName', 'courseCode', 'instructor']
      });
    }

    const course = new Course(req.body);
    await course.save();
    console.log('Course created successfully:', course);
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(400).json({ 
      message: 'Error creating course',
      error: error.message 
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating course:', id, req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    const course = await Course.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      console.log('Course not found:', id);
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('Course updated successfully:', course);
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(400).json({ 
      message: 'Error updating course',
      error: error.message 
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting course:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid course ID format' });
    }

    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      console.log('Course not found:', id);
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('Course deleted successfully:', course);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ 
      message: 'Error deleting course',
      error: error.message 
    });
  }
});

export default router; 