// DOM Elements
const signupButton = document.getElementById("signup-button");
const signupSection = document.getElementById("signup-section");
const loginForm = document.getElementById("loginForm");
const createAccountButton = document.getElementById("create-account");
const messageBox = document.getElementById("message-box");
const messageText = document.getElementById("message-text");

// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        this.querySelector('svg').style.stroke = type === 'password' ? 'currentColor' : '#4CAF50';
    });
});

// Show Sign Up Section
signupButton.addEventListener("click", () => {
    loginForm.style.display = "none";
    signupSection.style.display = "block";
});

// Register new user
createAccountButton.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const username = document.getElementById("new-username").value.trim();
    const password = document.getElementById("new-password").value;

    // Validate inputs
    if (!name || !email || !username || !password) {
        showMessage("Please fill in all fields.");
        return;
    }

    if (password.length < 8) {
        showMessage("Password must be at least 8 characters long.");
        return;
    }

    if (!validateEmail(email)) {
        showMessage("Please enter a valid email address.");
        return;
    }

    try {
        // Send data to Node.js backend
        const response = await fetch('http://localhost:5000/register', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                name, 
                email, 
                username, 
                password 
            })
        });

        const result = await response.json(); // Parse JSON response

        if (response.ok) {
            showMessage(result.message || "Registration successful! You can now login.");
            // Reset form and show login
            document.getElementById("signupForm").reset();
            signupSection.style.display = "none";
            loginForm.style.display = "block";
        } else {
            showMessage(result.error || "Registration failed. Please try again.");
        }
    } catch (error) {
        console.error("Registration error:", error);
        showMessage("An error occurred. Please try again later.");
    }
});

// Regular Login
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
        // Send data to Node.js backend
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                username, 
                password 
            })
        });

        const result = await response.json(); // Parse JSON response

        if (response.ok) {
            showMessage(result.message || "Login Successful!");
            // Store username in localStorage
            localStorage.setItem('username', username);
            localStorage.setItem('name', result.name);
            // Redirect to dashboard or home page
            window.location.href = "index.html";
        } else {
            showMessage(result.error || "Login Failed: Invalid credentials.");
        }
    } catch (error) {
        console.error("Login error:", error);
        showMessage("An error occurred. Please try again later.");
    }
});

// Helper function to validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Show Message
function showMessage(message) {
    messageText.textContent = message;
    messageBox.style.display = "block";
    setTimeout(() => {
        messageBox.style.display = "none";
    }, 3000);
}