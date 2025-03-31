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
            showMessage(result.message || "Registration successful! Redirecting to preferences...");
            
            // Store user details in localStorage
            localStorage.setItem('username', username);
            localStorage.setItem('name', name);
            localStorage.setItem('email', email);

            // Redirect to the preferences page
            setTimeout(() => {
                window.location.href = "select_preference.html";
            }, 2000); // Wait 2 seconds before redirecting
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

            // Generate a random background color for the icon if it doesn't already exist
            let iconBackgroundColor = localStorage.getItem('iconBackgroundColor');
            if (!iconBackgroundColor) {
                iconBackgroundColor = generateRandomColor();
                localStorage.setItem('iconBackgroundColor', iconBackgroundColor);
            }

            // Store username in localStorage
            localStorage.setItem('username', username);
            localStorage.setItem('name', result.name);
            localStorage.setItem('email', result.email);

            // Set guestMode to false
            localStorage.setItem('guestMode', 'false');

            console.log("User logged in successfully!");
            console.log("guestMode:", localStorage.getItem("guestMode"));

            
            // Fetch and store preferences
            const preferencesResponse = await fetch(`http://localhost:5000/getPreferences?username=${username}`);
            const preferences = await preferencesResponse.json();

            if (preferencesResponse.ok) {
                localStorage.setItem('countries', JSON.stringify(preferences.countries));
                localStorage.setItem('domains', JSON.stringify(preferences.domains));
                console.log("Preferences saved to localStorage:", preferences);
            } else {
                console.error("Failed to fetch preferences:", preferences.error);
            }
            
            console.log("Fetched preferences:", preferences);
            console.log("Stored countries:", localStorage.getItem('countries'));
            console.log("Stored domains:", localStorage.getItem('domains'));

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

function generateRandomColor() {
    const colors = [
        "#FF5733", "#33B5E5", "#33FF57", "#FFC300", "#FF33E5",
        "#8E44AD", "#E74C3C", "#3498db", "#F39C12", "#1ABC9C",
        "#2ECC71", "#9B59B6", "#D35400", "#C0392B", "#16A085",
        "#7D3C98", "#28B463", "#1F618D", "#F4D03F", "#C0392B"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

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

document.addEventListener('DOMContentLoaded', () => {
    const preferencesSaved = localStorage.getItem('preferencesSaved');

    if (preferencesSaved === 'true') {
        showMessage("Your preferences have been saved. Please log in to continue.");
        localStorage.removeItem('preferencesSaved'); // Clear the flag
    }
});