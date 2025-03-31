// Initialize Lucide icons
lucide.createIcons();

// Sidebar state
let isSidebarOpen = true;

// Toggle sidebar function
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    isSidebarOpen = !isSidebarOpen;

    sidebar.classList.toggle('closed');
    mainContent.classList.toggle('expanded');
}

// Function to get the current user's favorites key
function getFavoritesKey() {
    const username = localStorage.getItem("username");
    if (!username) {
        console.error("User not logged in!");
        return null;
    }
    return `favorites_${username}`;
}

// Function to load favorites for the current user
function loadFavorites() {
    const favoritesKey = getFavoritesKey();
    const guestMode = localStorage.getItem("guestMode");
    const username = localStorage.getItem("username");
    const name = localStorage.getItem("name");

    const favoritesContainer = document.getElementById("articles-container");
    const pageHeader = document.querySelector(".page-header");

    if (!favoritesContainer) {
        console.error("Favorites container not found!");
        return;
    }

    // Clear previous content
    favoritesContainer.innerHTML = "";

    // Check if the user is logged out or in guest mode
    if (guestMode === "true" || !username || !name) {
        console.log("User is logged out. Displaying guest mode message...");
        pageHeader.innerHTML = `
            <div class="centered-text">
                <h2>Welcome to Favorites</h2>
                <p>To view or add your favorite articles, you need to sign up or log in first.</p>
            </div>
        `;
        favoritesContainer.style.display = "none"; // Hide the articles grid
        return;
    }

    // User is logged in, load their favorites
    const favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];

    if (favorites.length === 0) {
        favoritesContainer.innerHTML = "<p>No favorites added yet.</p>";
        return;
    }

    favorites.forEach((newsItem, index) => {
        const newsCard = document.createElement("div");
        newsCard.classList.add("news-card");
        newsCard.innerHTML = `
            <div class="news-image">
                <img src="${newsItem.image}" alt="news-image">
            </div>
            <div class="news-content">
                <h3 class="news-title">${newsItem.title}</h3>
                <p class="news-source"><strong>Source:</strong> ${newsItem.source}</p>
                <p class="news-desc">${newsItem.description}</p>
                <a class="read-more-btn" href="${newsItem.url}" target="_blank" rel="noopener noreferrer">Read More</a>
                <button class="remove-btn" data-index="${index}">
                    <i data-lucide="trash-2"></i> Remove
                </button>
            </div>
        `;

        favoritesContainer.appendChild(newsCard);
    });

    // Attach event listeners to remove buttons dynamically
    document.querySelectorAll(".remove-btn").forEach(button => {
        button.addEventListener("click", function () {
            const index = this.getAttribute("data-index");
            removeFromFavorites(index);
        });
    });

    // Reinitialize Lucide icons for dynamically added content
    lucide.createIcons();
}

// Function to add a news item to favorites
function addToFavorites(newsItem) {
    const favoritesKey = getFavoritesKey();
    if (!favoritesKey) return;

    let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
    favorites.push(newsItem);
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));
}

// Function to remove a news item from favorites
function removeFromFavorites(index) {
    const favoritesKey = getFavoritesKey();
    if (!favoritesKey) return;

    let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
    favorites.splice(index, 1); // Remove the selected news
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));

    loadFavorites(); // Refresh the favorites section
}

// Load favorites when the page loads
document.addEventListener("DOMContentLoaded", loadFavorites);

// Load user information from the server
function loadUserInfo() {
    const username = localStorage.getItem('username');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    const guestMode = localStorage.getItem('guestMode');
    const iconBackgroundColor = localStorage.getItem('iconBackgroundColor');

    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');
    const userInitialElement = document.getElementById('user-initial');
    const userNameIconElement = document.getElementById('user-name-icon');
    const logoutButton = document.getElementById('logout-button'); // Logout button

    if (guestMode === "true" || !username || !name) {
        console.log("Displaying guest mode UI...");
        userNameElement.textContent = "User"; // Show "User" as name
        userEmailElement.innerHTML =`
            <div class="signup-container">
                <p>To get the access of every features do </p>
                <button id="signup-button" class="signup-button"><u>Sign Up</u></button>
            </div>
        `; // Replace email field with a "Sign Up" button
        userInitialElement.textContent = "G"; // Show "G" for Guest
        userNameIconElement.textContent = "Guest"; // Show "Guest" as username

        // Hide the Logout button
        logoutButton.style.display = "none";

        // Apply default background color for guest
        userInitialElement.style.backgroundColor = "#FF5733";

        // Add event listener to the "Sign Up" button
        const signupButton = document.getElementById("signup-button");
        signupButton.addEventListener("click", function () {
            console.log("Redirecting to sign-up page...");
            window.location.href = "login.html"; // Redirect to sign-up page
        });
    } else {
        console.log("Displaying logged-in user UI...");
        userNameElement.textContent = name || "User";
        userEmailElement.textContent = email || "user@example.com";
        userInitialElement.textContent = (name && name.charAt(0).toUpperCase()) || "U";
        userNameIconElement.textContent = username || "User Name";

        // Apply the stored background color to the icon
        userInitialElement.style.backgroundColor = iconBackgroundColor || "#FF5733";

        // Show the Logout button
        logoutButton.style.display = "block";

        // Add event listener to the Logout button
        logoutButton.addEventListener("click", function () {
            console.log("Logging out...");
            localStorage.removeItem("username");
            localStorage.removeItem("name");
            localStorage.setItem("guestMode", "true"); // Set guest mode
            window.location.reload(); // Refresh the page to reflect the logged-out state
        });
    }
}

// Load user info when the page loads
document.addEventListener("DOMContentLoaded", loadUserInfo);

// Load favorites and user info when the page loads
document.addEventListener("DOMContentLoaded", () => {
    loadUserInfo();    // Load user information
    loadFavorites(); 
});

// Handle active navigation links
document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach(link => {
        const linkPage = link.getAttribute("href");

        if (linkPage === currentPage) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }

        // Add click event listener for active class toggle
        link.addEventListener("click", function () {
            navLinks.forEach(nav => nav.classList.remove("active"));
            this.classList.add("active");
        });
    });

    // Initialize UI elements
    createScrollToTopButton();

    // Category & Country Selection Handling
    const categorySelect = document.getElementById("category-select");
    const countrySelect = document.getElementById("country-select");

    function handleCategoryChange() {
        const category = categorySelect.value;
        const country = countrySelect.value;
        const query = `${category} ${country}`.trim();
        fetchNews(query, false);
    }

    if (categorySelect && countrySelect) {
        categorySelect.addEventListener("change", handleCategoryChange);
        countrySelect.addEventListener("change", handleCategoryChange);
    } else {
        console.error("Category or Country select elements not found.");
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const usernameElement = document.getElementById("username");
    const nameElement = document.getElementById("name");
    const emailElement = document.getElementById("email");

    const username = localStorage.getItem("username");
    const name = localStorage.getItem("name");
    const guestMode = localStorage.getItem("guestMode");

    if (guestMode === "true" || !username || !name) {
        // User is in guest mode or logged out
        console.log("Displaying guest mode UI...");
        usernameElement.textContent = "Guest"; // Show "Guest" as username
        nameElement.textContent = "User"; // Show "User" as name

        // Replace email field with a "Sign Up" button
        emailElement.innerHTML = `<button id="signup-button">To get the access of every features do Sign Up</button>`;
        const signupButton = document.getElementById("signup-button");
        signupButton.addEventListener("click", function () {
            console.log("Redirecting to sign-up page...");
            window.location.href = "signup.html"; // Redirect to sign-up page
        });
    } else {
        // User is logged in
        console.log("Displaying logged-in user UI...");
        usernameElement.textContent = username; // Show logged-in username
        nameElement.textContent = name; // Show logged-in name
        emailElement.textContent = "user@example.com"; // Replace with actual email if available
    }
});