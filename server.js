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

// Register Endpoint
app.post('/register', async (req, res) => {
  const { name, email, username, password } = req.body;

  if (!name || !email || !username || !password) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

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

// Login Endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials!" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials!" });
    }

    res.json({
      success: true,
      message: "Login successful!",
      username: user.username,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed." });
  }
});

// Get User Info Endpoint
app.get('/getUserInfo', async (req, res) => {
  const username = req.query.username; // Get username from query parameters

  if (!username) {
    return res.status(400).json({ error: "Username is required!" });
  }

  try {
    const [users] = await pool.execute(
      'SELECT name, email, username FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found!" });
    }

    const user = users[0];
    res.json({
      name: user.name,
      email: user.email,
      username: user.username,
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "Failed to fetch user info." });
  }
});

// Save Preferences Endpoint
app.post('/savePreferences', async (req, res) => {
  const { username, countries, domains } = req.body;

  if (!username || !countries || !domains) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  try {
    // Save preferences in the database
    await pool.execute(
      `INSERT INTO preferences (username, countries, domains) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE countries = ?, domains = ?`,
      [username, JSON.stringify(countries), JSON.stringify(domains), JSON.stringify(countries), JSON.stringify(domains)]
    );

    res.json({ success: true, message: "Preferences saved successfully!" });
  } catch (error) {
    console.error("Error saving preferences:", error);
    res.status(500).json({ error: "Failed to save preferences." });
  }
});

// Get Preferences Endpoint
app.get('/getPreferences', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username is required!" });
  }

  try {
    const [preferences] = await pool.execute(
      'SELECT countries, domains FROM preferences WHERE username = ?',
      [username]
    );

    if (preferences.length === 0) {
      return res.status(404).json({ error: "Preferences not found!" });
    }

    const userPreferences = preferences[0];
    // Ensure countries and domains are valid JSON
    const countries = Array.isArray(userPreferences.countries)
      ? userPreferences.countries
      : JSON.parse(userPreferences.countries || "[]");

    const domains = Array.isArray(userPreferences.domains)
      ? userPreferences.domains
      : JSON.parse(userPreferences.domains || "[]");

    res.json({ countries, domains });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ error: "Failed to fetch preferences." });
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