const express = require('express');
const { getUserTodos, addTodo, updateTodo, deleteTodo, generateId } = require('../data/store');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all todos for user
router.get('/', authenticateToken, (req, res) => {
  try {
    const userTodos = getUserTodos(req.user.id);
    res.json(userTodos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Create new todo
router.post('/', authenticateToken, (req, res) => {
  try {
    const { text, priority = 'medium', dueDate } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Todo text is required' });
    }

    const todo = {
      id: generateId(),
      userId: req.user.id,
      text: text.trim(),
      completed: false,
      priority,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addTodo(todo);
    res.status(201).json(todo);
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// Update todo
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verify todo belongs to user
    const userTodos = getUserTodos(req.user.id);
    const existingTodo = userTodos.find(todo => todo.id === id);
    
    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    // Update todo
    const updatedTodo = updateTodo(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    if (!updatedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(updatedTodo);
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete todo
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    // Verify todo belongs to user
    const userTodos = getUserTodos(req.user.id);
    const existingTodo = userTodos.find(todo => todo.id === id);
    
    if (!existingTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const deletedTodo = deleteTodo(id);
    if (!deletedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Get todo statistics
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const userTodos = getUserTodos(req.user.id);
    const total = userTodos.length;
    const completed = userTodos.filter(todo => todo.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Priority breakdown
    const priorityStats = {
      high: userTodos.filter(todo => todo.priority === 'high' && !todo.completed).length,
      medium: userTodos.filter(todo => todo.priority === 'medium' && !todo.completed).length,
      low: userTodos.filter(todo => todo.priority === 'low' && !todo.completed).length
    };

    res.json({
      total,
      completed,
      pending,
      completionRate,
      priorityStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;