import express from 'express';
import Task from '../models/Task.js';

const router = express.Router();

router.get('/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    
    // Create start and end dates in UTC
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    const tasks = await Task.find({
      userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ time: 1 });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    console.log('Updating task with ID:', req.params.id);
    console.log('Update data:', req.body);

    // Remove _id from the update data if it exists
    const updateData = { ...req.body };
    delete updateData._id;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );

    if (!task) {
      console.log('Task not found');
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('Task updated successfully:', task);
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 