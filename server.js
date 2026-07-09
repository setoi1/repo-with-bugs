const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// In-memory data store
let tasks = [
  { id: 1, title: 'Sample Task 1', description: 'This is a sample task', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
  { id: 2, title: 'Sample Task 2', description: 'Another sample task', completed: true, priority: 'high', createdAt: new Date().toISOString() }
];

let nextId = 3;

// BUG 1: No input validation - allows empty tasks
app.post('/api/tasks', (req, res) => {
  const { title, description, priority } = req.body;
  
  const newTask = {
    id: nextId++,
    title: title,
    description: description,
    completed: false,
    priority: priority,
    createdAt: new Date().toISOString()
  };
  
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// BUG 2: Returns all tasks even when filter is specified
app.get('/api/tasks', (req, res) => {
  const { filter } = req.query;
  
  // Filter logic is broken - always returns all tasks
  let filteredTasks = tasks;
  
  if (filter === 'completed') {
    filteredTasks = tasks; // BUG: Not actually filtering
  } else if (filter === 'active') {
    filteredTasks = tasks; // BUG: Not actually filtering
  }
  
  res.json(filteredTasks);
});

// BUG 3: No validation if task exists
app.get('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);
  
  // BUG: No check if task is undefined
  res.json(task);
});

// BUG 4: Doesn't update all fields properly
app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  // BUG: Only updates title, ignoring other fields
  tasks[taskIndex].title = req.body.title;
  
  res.json(tasks[taskIndex]);
});

// BUG 5: Race condition when toggling completion
app.patch('/api/tasks/:id/toggle', (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  // BUG: Simulating race condition - delayed response
  setTimeout(() => {
    task.completed = !task.completed;
    res.json(task);
  }, 100);
});

// BUG 6: Doesn't actually delete the task
app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  // BUG: Doesn't actually remove the task from array
  const deletedTask = tasks[taskIndex];
  // tasks.splice(taskIndex, 1); // This line is commented out!
  
  res.json(deletedTask);
});

// BUG 7: Search is case-sensitive and doesn't search description
app.get('/api/tasks/search/:query', (req, res) => {
  const query = req.params.query;
  
  // BUG: Case-sensitive search, only searches title
  const results = tasks.filter(task => task.title.includes(query));
  
  res.json(results);
});

// BUG 8: Statistics calculation is wrong
app.get('/api/stats', (req, res) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;
  
  const completionRate = (completed / total) * 100;
  
  res.json({
    total,
    completed,
    active,
    completionRate: completionRate + '%'
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
