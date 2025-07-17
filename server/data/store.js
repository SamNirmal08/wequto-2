// In-memory data store (replace with database in production)
const users = [];
const todos = [];
const taskHistory = [];
const weatherCache = new Map();
const userSessions = new Map();

// Sample data for development
const sampleQuotes = [
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "In a gentle way, you can shake the world.", author: "Mahatma Gandhi" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" }
];

// Helper functions
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const findUserById = (id) => users.find(user => user.id === id);
const findUserByEmail = (email) => users.find(user => user.email === email);

const getUserTodos = (userId) => todos.filter(todo => todo.userId === userId);
const addTodo = (todo) => todos.push(todo);
const updateTodo = (id, updates) => {
  const index = todos.findIndex(todo => todo.id === id);
  if (index !== -1) {
    const oldTodo = { ...todos[index] };
    todos[index] = { ...todos[index], ...updates };
    
    // If task is being completed, add to history
    if (!oldTodo.completed && updates.completed === true) {
      const historyEntry = {
        id: generateId(),
        originalTodoId: oldTodo.id,
        userId: oldTodo.userId,
        text: oldTodo.text,
        priority: oldTodo.priority || 'medium',
        createdAt: oldTodo.createdAt,
        completedAt: new Date().toISOString(),
        timeToComplete: new Date() - new Date(oldTodo.createdAt),
        category: oldTodo.category || 'general'
      };
      taskHistory.push(historyEntry);
    }
    
    return todos[index];
  }
  return null;
};

const deleteTodo = (id) => {
  const index = todos.findIndex(todo => todo.id === id);
  if (index !== -1) {
    const deletedTodo = todos.splice(index, 1)[0];
    
    // If completed task is being deleted, add to history if not already there
    if (deletedTodo.completed) {
      const existingHistory = taskHistory.find(h => h.originalTodoId === deletedTodo.id);
      if (!existingHistory) {
        const historyEntry = {
          id: generateId(),
          originalTodoId: deletedTodo.id,
          userId: deletedTodo.userId,
          text: deletedTodo.text,
          priority: deletedTodo.priority || 'medium',
          createdAt: deletedTodo.createdAt,
          completedAt: deletedTodo.updatedAt || new Date().toISOString(),
          timeToComplete: new Date(deletedTodo.updatedAt || new Date()) - new Date(deletedTodo.createdAt),
          category: deletedTodo.category || 'general'
        };
        taskHistory.push(historyEntry);
      }
    }
    
    return deletedTodo;
  }
  return null;
};

// Weather cache helpers
const getWeatherCache = (city) => {
  const cached = weatherCache.get(city);
  if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) { // 10 minutes
    return cached.data;
  }
  return null;
};

const setWeatherCache = (city, data) => {
  weatherCache.set(city, {
    data,
    timestamp: Date.now()
  });
};

// Task history helpers
const getUserTaskHistory = (userId) => taskHistory.filter(entry => entry.userId === userId);

const getTaskHistoryStats = (userId) => {
  const userHistory = getUserTaskHistory(userId);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return {
    total: userHistory.length,
    today: userHistory.filter(entry => new Date(entry.completedAt) >= today).length,
    thisWeek: userHistory.filter(entry => new Date(entry.completedAt) >= thisWeek).length,
    thisMonth: userHistory.filter(entry => new Date(entry.completedAt) >= thisMonth).length,
    averageTimeToComplete: userHistory.length > 0 
      ? userHistory.reduce((sum, entry) => sum + entry.timeToComplete, 0) / userHistory.length 
      : 0,
    priorityBreakdown: {
      high: userHistory.filter(entry => entry.priority === 'high').length,
      medium: userHistory.filter(entry => entry.priority === 'medium').length,
      low: userHistory.filter(entry => entry.priority === 'low').length
    }
  };
};

module.exports = {
  users,
  todos,
  taskHistory,
  weatherCache,
  userSessions,
  sampleQuotes,
  generateId,
  findUserById,
  findUserByEmail,
  getUserTodos,
  addTodo,
  updateTodo,
  deleteTodo,
  getWeatherCache,
  setWeatherCache,
  getUserTaskHistory,
  getTaskHistoryStats
};