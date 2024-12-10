import express from 'express';
import Todo from '../models/Todo.js';

const router = express.Router();

// Middleware to validate request parameters
const validateParams = (req, res, next) => {
  const { courseId } = req.params;
  const { userId } = req.query;

  if (!courseId) {
    return res.status(400).json({ message: 'Course ID is required' });
  }
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  next();
};

// Get todos for a course
router.get('/:courseId', validateParams, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.query;

    console.log('Fetching todos:', { courseId, userId });

    const todos = await Todo.find({ courseId, userId })
      .sort({ createdAt: -1 });

    console.log(`Found ${todos.length} todos`);
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ 
      message: 'Failed to fetch todos',
      error: error.message
    });
  }
});

// Create new todo
router.post('/', async (req, res) => {
  try {
    const { courseId, userId, text } = req.body;

    console.log('Creating todo:', { courseId, userId, text });

    if (!courseId || !userId || !text) {
      return res.status(400).json({ 
        message: 'Course ID, User ID, and text are required',
        received: { courseId, userId, text }
      });
    }

    const todo = new Todo({
      courseId,
      userId,
      text,
      completed: false
    });

    const savedTodo = await todo.save();
    console.log('Todo created:', savedTodo);
    res.status(201).json(savedTodo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(400).json({ 
      message: 'Failed to create todo',
      error: error.message
    });
  }
});

// Update todo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    console.log('Updating todo:', { id, update: req.body });

    if (!userId) {
      return res.status(400).json({ 
        message: 'User ID is required',
        received: req.body
      });
    }

    const todo = await Todo.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!todo) {
      console.log('Todo not found or unauthorized:', { id, userId });
      return res.status(404).json({ message: 'Todo not found or unauthorized' });
    }

    console.log('Todo updated:', todo);
    res.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(400).json({ 
      message: 'Failed to update todo',
      error: error.message
    });
  }
});

// Delete todo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    console.log('Deleting todo:', { id, userId });

    if (!userId) {
      return res.status(400).json({ 
        message: 'User ID is required',
        received: req.query
      });
    }

    const todo = await Todo.findOneAndDelete({
      _id: id,
      userId
    });

    if (!todo) {
      console.log('Todo not found or unauthorized:', { id, userId });
      return res.status(404).json({ message: 'Todo not found or unauthorized' });
    }

    console.log('Todo deleted:', todo);
    res.json({ message: 'Todo deleted successfully', todo });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ 
      message: 'Failed to delete todo',
      error: error.message
    });
  }
});

export default router; 