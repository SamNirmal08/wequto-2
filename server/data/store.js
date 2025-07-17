// In-memory data store (replace with database in production)
const users = [];
const todos = [];
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
    todos[index] = { ...todos[index], ...updates };
    return todos[index];
  }
  return null;
};
const deleteTodo = (id) => {
  const index = todos.findIndex(todo => todo.id === id);
  if (index !== -1) {
    return todos.splice(index, 1)[0];
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

module.exports = {
  users,
  todos,
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
  setWeatherCache
};