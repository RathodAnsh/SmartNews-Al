const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve frontend files

// MySQL Connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // Replace with yours
  password: '123456',
  database: 'register',
});

// Routes
app.post('/register', async (req, res) => {
  const { name, email, username, password } = req.body;
  
  // Validate inputs (add more checks if needed)
  if (!name || !email || !username || !password) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save to MySQL
    await pool.execute(
      `INSERT INTO users (name, email, username, password) 
       VALUES (?, ?, ?, ?)`,
      [name, email, username, hashedPassword]
    );
    res.json({ success: true, message: "Registration successful!" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: "Username/email already exists!" });
    } else {
      res.status(500).json({ error: "Database error." });
    }
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check user in MySQL
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials!" });
    }

    // Verify password
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials!" });
    }

    res.json({ success: true, message: "Login successful!", username: user.username, name: user.name});
  } catch (error) {
    res.status(500).json({ error: "Login failed." });
  }
});

// Serve HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'templates/login.html'));
});

// Start server
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});