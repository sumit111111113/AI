const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 9000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Serve static files
app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure directories exist
if (!fs.existsSync('public/uploads')) {
  fs.mkdirSync('public/uploads', { recursive: true });
}
if (!fs.existsSync('data')) {
  fs.mkdirSync('data', { recursive: true });
}

// Initialize users data file
const usersFile = 'data/users.json';
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify([]));
}

// Routes
app.get('/', (req, res) => {
  res.render('index', { layout: false });
});

// API endpoint to save user data
app.post('/api/register', (req, res) => {
  try {
    const { name, descriptors } = req.body;
    
    if (!name || !descriptors || !Array.isArray(descriptors)) {
      return res.status(400).json({ error: 'Invalid data provided' });
    }

    // Read existing users
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    
    // Check if user already exists
    const existingUser = users.find(user => user.name.toLowerCase() === name.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Add new user
    const newUser = {
      id: Date.now().toString(),
      name,
      descriptors,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    
    res.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// API endpoint to get all users for recognition
app.get('/api/users', (req, res) => {
  try {
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// API endpoint to delete a user
app.delete('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    
    const filteredUsers = users.filter(user => user.id !== id);
    fs.writeFileSync(usersFile, JSON.stringify(filteredUsers, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});