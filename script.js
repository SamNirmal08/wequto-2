// Global Variables
let todos = JSON.parse(localStorage.getItem('serenity-todos')) || [];
let taskHistory = JSON.parse(localStorage.getItem('serenity-task-history')) || [];
let currentTheme = localStorage.getItem('serenity-theme') || 'sunset';
let currentCity = localStorage.getItem('serenity-city') || 'Chennai';
let deferredPrompt = null;
let currentUser = null;
let isOnline = navigator.onLine;



const quotes = [
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "In a gentle way, you can shake the world.", author: "Mahatma Gandhi" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "With the new day comes new strength and new thoughts.", author: "Eleanor Roosevelt" },
  { text: "Try to be a rainbow in someone's cloud.", author: "Maya Angelou" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Positive anything is better than negative nothing.", author: "Elbert Hubbard" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Don't wait. The time will never be just right.", author: "Napoleon Hill" },
  { text: "Every day may not be good... but there's something good in every day.", author: "Alice Morse Earle" },
  { text: "Be so happy that, when other people look at you, they become happy too.", author: "Yoko Ono" },
  { text: "Your mind is a powerful thing. When you fill it with positive thoughts, your life will start to change.", author: "Unknown" },
  { text: "Only in the darkness can you see the stars.", author: "Martin Luther King Jr." },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Life is like riding a bicycle. To keep your balance, you must keep moving.", author: "Albert Einstein" },
  { text: "Peace begins with a smile.", author: "Mother Teresa" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Difficult roads often lead to beautiful destinations.", author: "Zig Ziglar" }
];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication status
  checkAuthStatus();
  
  // Hide splash screen after 2.5 seconds
  setTimeout(() => {
    document.getElementById('splash-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
  }, 2500);

  // Initialize theme
  applyTheme(currentTheme);
  
  // Initialize city
  document.getElementById('city-select').value = currentCity;
  
  // Load initial data
  generateNewQuote();
  updateStats();
  renderTodos();
  fetchWeather(currentCity);

  // PWA Setup
  setupPWA();
  
  // Notification permission
  requestNotificationPermission();
  
  // Online/offline status
  window.addEventListener('online', handleOnlineStatus);
  window.addEventListener('offline', handleOnlineStatus);
});

// Authentication Functions
async function checkAuthStatus() {
  try {
    if (apiClient.token) {
      currentUser = await apiClient.getCurrentUser();
      await syncWithBackend();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    // Token might be expired, clear it
    apiClient.setToken(null);
    currentUser = null;
  }
}

async function syncWithBackend() {
  if (!currentUser || !isOnline) return;
  
  try {
    // Sync todos
    const backendTodos = await apiClient.getTodos();
    todos = backendTodos;
    localStorage.setItem('serenity-todos', JSON.stringify(todos));
    renderTodos();
    updateStats();
    
    // Sync task history
    const historyResponse = await apiClient.getTaskHistory(1, 100);
    taskHistory = historyResponse.history || [];
    localStorage.setItem('serenity-task-history', JSON.stringify(taskHistory));
    
    // Sync preferences
    if (currentUser.preferences) {
      currentTheme = currentUser.preferences.theme || 'sunset';
      currentCity = currentUser.preferences.city || 'Chennai';
      applyTheme(currentTheme);
      document.getElementById('city-select').value = currentCity;
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

function handleOnlineStatus() {
  isOnline = navigator.onLine;
  if (isOnline && currentUser) {
    syncWithBackend();
    showToast('Back online - syncing data...', 'success');
  } else if (!isOnline) {
    showToast('You are offline - changes will sync when reconnected', 'warning');
  }
}
// Theme Management
function applyTheme(theme) {
  document.body.className = `theme-${theme}`;
  document.querySelectorAll('.theme-option').forEach(option => {
    option.classList.toggle('active', option.dataset.theme === theme);
  });
  currentTheme = theme;
  localStorage.setItem('serenity-theme', theme);
  
  // Update user preferences if logged in
  if (currentUser && isOnline) {
    apiClient.updatePreferences({ theme }).catch(console.error);
  }
}

function toggleThemeSelector() {
  const selector = document.getElementById('theme-selector');
  selector.classList.toggle('active');
}

// Theme selector event listeners
document.querySelectorAll('.theme-option').forEach(option => {
  option.addEventListener('click', () => {
    applyTheme(option.dataset.theme);
    toggleThemeSelector();
  });
});

// Close theme selector when clicking outside
document.addEventListener('click', (e) => {
  const selector = document.getElementById('theme-selector');
  const themeBtn = e.target.closest('button[onclick="toggleThemeSelector()"]');
  if (!selector.contains(e.target) && !themeBtn) {
    selector.classList.remove('active');
  }
});

// Weather Functions
async function fetchWeather(city) {
  if (!city) return;
  
  const loading = document.getElementById('weather-loading');
  const error = document.getElementById('weather-error');
  const content = document.getElementById('weather-content');
  const refreshIcon = document.getElementById('weather-refresh-icon');

  loading.classList.remove('hidden');
  error.classList.add('hidden');
  content.style.opacity = '0.5';
  refreshIcon.classList.add('animate-spin');

  try {
    let data;
    
    if (currentUser && isOnline) {
      // Use backend API
      data = await apiClient.getWeather(city);
    } else {
      // Fallback to direct API call
      const apiKey = '9802df5f24558a016628d5e625a40817';
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );
      
      if (!response.ok) throw new Error('Weather data not available');
      const rawData = await response.json();
      
      data = {
        city: rawData.name,
        temperature: Math.round(rawData.main.temp),
        description: rawData.weather[0].description,
        humidity: rawData.main.humidity,
        windSpeed: Math.round(rawData.wind.speed * 3.6)
      };
    }
    
    // Update weather display
    document.getElementById('weather-icon').textContent = getWeatherIcon(data.description);
    document.getElementById('weather-temp').textContent = `${data.temperature}°C`;
    document.getElementById('weather-city').textContent = `${data.city}, Tamil Nadu`;
    document.getElementById('weather-humidity').textContent = `${data.humidity}%`;
    document.getElementById('weather-wind').textContent = `${data.windSpeed} km/h`;
    
    // Update stats
    document.getElementById('weather-stat').textContent = `${data.temperature}°C`;
    document.getElementById('weather-location').textContent = data.city;
    
    content.style.opacity = '1';
    loading.classList.add('hidden');
  } catch (error) {
    console.error('Weather fetch failed:', error);
    document.getElementById('weather-error').classList.remove('hidden');
    loading.classList.add('hidden');
    content.style.opacity = '1';
  } finally {
    refreshIcon.classList.remove('animate-spin');
  }
}

function getWeatherIcon(condition) {
  const conditionLower = condition.toLowerCase();
  if (conditionLower.includes('cloud')) return '☁️';
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return '🌧️';
  if (conditionLower.includes('thunder')) return '⛈️';
  if (conditionLower.includes('snow')) return '❄️';
  if (conditionLower.includes('mist') || conditionLower.includes('fog')) return '🌫️';
  if (conditionLower.includes('clear') || conditionLower.includes('sun')) return '☀️';
  return '🌤️';
}

function updateWeatherLocation() {
  const select = document.getElementById('city-select');
  currentCity = select.value;
  localStorage.setItem('serenity-city', currentCity);
  
  // Update user preferences if logged in
  if (currentUser && isOnline) {
    apiClient.updatePreferences({ city: currentCity }).catch(console.error);
  }
  
  if (currentCity) {
    fetchWeather(currentCity);
  }
}

function refreshWeather() {
  fetchWeather(currentCity);
}

// Quote Functions
async function generateNewQuote() {
  try {
    let quote;
    
    if (currentUser && isOnline) {
      // Use backend API
      quote = await apiClient.getRandomQuote();
    } else {
      // Fallback to local quotes
      const randomIndex = Math.floor(Math.random() * quotes.length);
      quote = quotes[randomIndex];
    }
    
    document.getElementById('quote-text').textContent = `"${quote.text}"`;
    document.getElementById('quote-author').textContent = `— ${quote.author}`;
  } catch (error) {
    console.error('Failed to fetch quote:', error);
    // Fallback to local quotes
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    document.getElementById('quote-text').textContent = `"${quote.text}"`;
    document.getElementById('quote-author').textContent = `— ${quote.author}`;
  }
}

// Todo Functions
function saveTodos() {
  localStorage.setItem('serenity-todos', JSON.stringify(todos));
}

function saveTaskHistory() {
  localStorage.setItem('serenity-task-history', JSON.stringify(taskHistory));
}

function renderTodos() {
  const todoList = document.getElementById('todo-list');
  const emptyTodos = document.getElementById('empty-todos');
  
  if (todos.length === 0) {
    todoList.innerHTML = '';
    emptyTodos.classList.remove('hidden');
    return;
  }
  
  emptyTodos.classList.add('hidden');
  
  todoList.innerHTML = todos.map(todo => `
    <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
      <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="toggleTodo(${todo.id})">
        ${todo.completed ? '✓' : ''}
      </div>
      <div class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</div>
      <button class="todo-delete" onclick="deleteTodo(${todo.id})">❌</button>
    </div>
  `).join('');
}

async function addTodo() {
  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  
  if (!text) return;
  
  const todo = {
    id: Date.now(),
    text: text,
    completed: false,
    createdAt: new Date()
  };
  
  try {
    if (currentUser && isOnline) {
      // Create via backend
      const createdTodo = await apiClient.createTodo({ text });
      todos.unshift(createdTodo);
    } else {
      // Create locally
      todos.unshift(todo);
    }
    
    saveTodos();
    renderTodos();
    updateStats();
    input.value = '';
    
    // Show success feedback
    showToast('Task added successfully!', 'success');
  } catch (error) {
    console.error('Failed to add todo:', error);
    showToast('Failed to add task - saved locally', 'warning');
    
    // Add locally as fallback
    todos.unshift(todo);
    saveTodos();
    renderTodos();
    updateStats();
    input.value = '';
  }
  
  // Schedule notification (demo: 1 minute)
  scheduleNotification(todo, 60000);
}

async function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    const newCompleted = !todo.completed;
    
    try {
      if (currentUser && isOnline) {
        // Update via backend
        await apiClient.updateTodo(id, { completed: newCompleted });
      }
      
      // If completing a task, add to history
      if (newCompleted && !todo.completed) {
        const historyEntry = {
          id: Date.now() + Math.random(),
          originalTodoId: todo.id,
          text: todo.text,
          priority: todo.priority || 'medium',
          createdAt: todo.createdAt || new Date().toISOString(),
          completedAt: new Date().toISOString(),
          timeToComplete: new Date() - new Date(todo.createdAt || new Date()),
          category: todo.category || 'general'
        };
        taskHistory.unshift(historyEntry);
        saveTaskHistory();
      }
      
      todo.completed = newCompleted;
      saveTodos();
      renderTodos();
      updateStats();
      
      if (todo.completed) {
        showToast('Task completed! 🎉', 'success');
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
      showToast('Update failed - saved locally', 'warning');
      
      // Update locally as fallback
      todo.completed = newCompleted;
      saveTodos();
      renderTodos();
      updateStats();
    }
  }
}

async function deleteTodo(id) {
  try {
    if (currentUser && isOnline) {
      // Delete via backend
      await apiClient.deleteTodo(id);
    }
    
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
    updateStats();
    showToast('Task deleted', 'info');
  } catch (error) {
    console.error('Failed to delete todo:', error);
    showToast('Delete failed - removed locally', 'warning');
    
    // Delete locally as fallback
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
    updateStats();
  }
}

async function clearCompleted() {
  const completedTodos = todos.filter(t => t.completed);
  
  try {
    // Add completed todos to history if not already there
    completedTodos.forEach(todo => {
      const existingHistory = taskHistory.find(h => h.originalTodoId === todo.id);
      if (!existingHistory) {
        const historyEntry = {
          id: Date.now() + Math.random(),
          originalTodoId: todo.id,
          text: todo.text,
          priority: todo.priority || 'medium',
          createdAt: todo.createdAt || new Date().toISOString(),
          completedAt: todo.updatedAt || new Date().toISOString(),
          timeToComplete: new Date(todo.updatedAt || new Date()) - new Date(todo.createdAt || new Date()),
          category: todo.category || 'general'
        };
        taskHistory.unshift(historyEntry);
      }
    });
    saveTaskHistory();
    
    if (currentUser && isOnline) {
      // Delete completed todos via backend
      await Promise.all(
        completedTodos.map(todo => apiClient.deleteTodo(todo.id))
      );
    }
    
    const completedCount = completedTodos.length;
    todos = todos.filter(t => !t.completed);
    saveTodos();
    renderTodos();
    updateStats();
    showToast(`${completedCount} completed tasks cleared`, 'info');
  } catch (error) {
    console.error('Failed to clear completed:', error);
    showToast('Clear failed - removed locally', 'warning');
    
    // Clear locally as fallback
    const completedCount = completedTodos.length;
    todos = todos.filter(t => !t.completed);
    saveTodos();
    renderTodos();
    updateStats();
  }
}


function handleTodoKeypress(event) {
  if (event.key === 'Enter') {
    addTodo();
  }
}

function focusTodoInput() {
  const input = document.getElementById('todo-input');
  input.focus();
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Stats Functions
function updateStats() {
  const completed = todos.filter(t => t.completed).length;
  const pending = todos.filter(t => !t.completed).length;
  const total = todos.length;
  const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  document.getElementById('pending-stat').textContent = pending;
  document.getElementById('completion-stat').textContent = `${completionPercent}%`;
  document.getElementById('pending-badge').textContent = `${pending} pending`;
  
  // Update todo stats
  const todoStats = document.getElementById('todo-stats');
  if (total > 0) {
    todoStats.classList.remove('hidden');
    document.getElementById('completed-count').textContent = completed;
    document.getElementById('total-count').textContent = total;
    document.getElementById('completion-percent').textContent = `${completionPercent}%`;
    document.getElementById('progress-bar').style.width = `${completionPercent}%`;
  } else {
    todoStats.classList.add('hidden');
  }
  
  // Show/hide clear button
  const clearBtn = document.getElementById('clear-btn');
  if (completed > 0) {
    clearBtn.style.display = 'block';
  } else {
    clearBtn.style.display = 'none';
  }
  
  // Update notification count
  updateNotificationCount(pending);
}

// Task History Functions
function showTaskHistory() {
  const modal = document.getElementById('history-modal');
  modal.classList.remove('hidden');
  renderTaskHistory();
  updateHistoryStats();
}

function hideTaskHistory() {
  const modal = document.getElementById('history-modal');
  modal.classList.add('hidden');
}

function renderTaskHistory(period = 'all') {
  const historyList = document.getElementById('history-list');
  const emptyHistory = document.getElementById('empty-history');
  
  let filteredHistory = [...taskHistory];
  
  // Filter by period
  if (period !== 'all') {
    const now = new Date();
    let filterDate;
    
    switch (period) {
      case 'today':
        filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        filterDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'month':
        filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    
    if (filterDate) {
      filteredHistory = filteredHistory.filter(entry => 
        new Date(entry.completedAt) >= filterDate
      );
    }
  }
  
  if (filteredHistory.length === 0) {
    historyList.innerHTML = '';
    emptyHistory.classList.remove('hidden');
    return;
  }
  
  emptyHistory.classList.add('hidden');
  
  // Group by date
  const groupedHistory = {};
  filteredHistory.forEach(entry => {
    const date = new Date(entry.completedAt).toDateString();
    if (!groupedHistory[date]) {
      groupedHistory[date] = [];
    }
    groupedHistory[date].push(entry);
  });
  
  historyList.innerHTML = Object.entries(groupedHistory)
    .sort(([a], [b]) => new Date(b) - new Date(a))
    .map(([date, entries]) => `
      <div class="history-date-group">
        <h4 class="history-date">${formatHistoryDate(date)}</h4>
        ${entries.map(entry => `
          <div class="history-item">
            <div class="history-item-content">
              <div class="history-item-text">${entry.text}</div>
              <div class="history-item-meta">
                <span class="history-priority priority-${entry.priority}">${entry.priority}</span>
                <span class="history-time">${formatTime(entry.completedAt)}</span>
                <span class="history-duration">${formatDuration(entry.timeToComplete)}</span>
              </div>
            </div>
            <div class="history-item-icon">✅</div>
          </div>
        `).join('')}
      </div>
    `).join('');
}

function updateHistoryStats() {
  const today = taskHistory.filter(entry => {
    const entryDate = new Date(entry.completedAt);
    const todayDate = new Date();
    return entryDate.toDateString() === todayDate.toDateString();
  }).length;
  
  const thisWeek = taskHistory.filter(entry => {
    const entryDate = new Date(entry.completedAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return entryDate >= weekAgo;
  }).length;
  
  const thisMonth = taskHistory.filter(entry => {
    const entryDate = new Date(entry.completedAt);
    const now = new Date();
    return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
  }).length;
  
  const avgTime = taskHistory.length > 0 
    ? taskHistory.reduce((sum, entry) => sum + (entry.timeToComplete || 0), 0) / taskHistory.length 
    : 0;
  
  document.getElementById('history-total').textContent = taskHistory.length;
  document.getElementById('history-today').textContent = today;
  document.getElementById('history-week').textContent = thisWeek;
  document.getElementById('history-month').textContent = thisMonth;
  document.getElementById('history-avg-time').textContent = formatDuration(avgTime);
}

function filterHistory(period) {
  // Update active filter button
  document.querySelectorAll('.history-filter').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.period === period);
  });
  
  renderTaskHistory(period);
}

function formatHistoryDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDuration(milliseconds) {
  if (!milliseconds || milliseconds < 0) return '0m';
  
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else {
    return `${minutes}m`;
  }
}

// Notification Functions
async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted');
    }
  }
}

function scheduleNotification(todo, delay) {
  if ('Notification' in window && Notification.permission === 'granted') {
    setTimeout(() => {
      // Check if todo is still pending
      const currentTodo = todos.find(t => t.id === todo.id);
      if (currentTodo && !currentTodo.completed) {
        new Notification('Serenity Reminder', {
          body: `Don't forget: ${todo.text}`,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%237b2ff7"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="40">🌤️</text></svg>',
          tag: `todo-${todo.id}`,
          requireInteraction: true
        });
      }
    }, delay);
  }
}

function updateNotificationCount(count) {
  const countElement = document.getElementById('notification-count');
  if (count > 0) {
    countElement.textContent = count;
    countElement.classList.remove('hidden');
    countElement.style.background = 'linear-gradient(135deg, #f107a3, #ef4444)';
    countElement.style.color = 'white';
    countElement.style.borderRadius = '50%';
    countElement.style.padding = '2px 6px';
    countElement.style.fontSize = '0.75rem';
    countElement.style.fontWeight = '600';
    countElement.style.marginLeft = '4px';
    countElement.classList.add('animate-pulse-soft');
  } else {
    countElement.classList.add('hidden');
    countElement.classList.remove('animate-pulse-soft');
  }
}

function toggleNotifications() {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      requestNotificationPermission();
    } else if (Notification.permission === 'granted') {
      showToast('Notifications are enabled', 'success');
    } else {
      showToast('Please enable notifications in your browser settings', 'warning');
    }
  } else {
    showToast('Notifications not supported', 'error');
  }
}

// PWA Functions
function setupPWA() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.error('SW registration failed:', error);
      });
  }

  // Handle install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
  });

  // Create manifest dynamically
  const manifest = {
    name: "Serenity Dashboard",
    short_name: "Serenity",
    description: "Beautiful productivity app with weather forecasts, inspirational quotes, and smart to-do management",
    theme_color: "#7b2ff7",
    background_color: "#ffffff",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    start_url: "/",
    icons: [
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%237b2ff7;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23f107a3;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='512' height='512' rx='128' fill='url(%23grad)'/%3E%3Ctext x='256' y='320' text-anchor='middle' fill='white' font-size='200'%3E🌤️%3C/text%3E%3C/svg%3E",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%237b2ff7;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23f107a3;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='512' height='512' rx='128' fill='url(%23grad)'/%3E%3Ctext x='256' y='320' text-anchor='middle' fill='white' font-size='200'%3E🌤️%3C/text%3E%3C/svg%3E",
        sizes: "512x512",
        type: "image/svg+xml"
      }
    ]
  };

  const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const manifestURL = URL.createObjectURL(manifestBlob);
  document.getElementById('manifest-placeholder').href = manifestURL;
}

function showInstallPrompt() {
  const prompt = document.getElementById('install-prompt');
  prompt.classList.add('show');
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    hideInstallPrompt();
  }, 10000);
}

function hideInstallPrompt() {
  const prompt = document.getElementById('install-prompt');
  prompt.classList.remove('show');
  deferredPrompt = null;
}

async function installApp() {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const choiceResult = await deferredPrompt.userChoice;
  
  if (choiceResult.outcome === 'accepted') {
    showToast('App installed successfully! 🎉', 'success');
  }
  
  hideInstallPrompt();
}

// Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    backdrop-filter: blur(8px);
    animation: slideUp 0.3s ease-out;
    max-width: 300px;
  `;
  
  switch (type) {
    case 'success':
      toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      break;
    case 'error':
      toast.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      break;
    case 'warning':
      toast.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
      break;
    default:
      toast.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
  }
  
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}
