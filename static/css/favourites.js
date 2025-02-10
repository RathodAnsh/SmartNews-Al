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

// Function to load favorites from localStorage
function loadFavorites() {
    const favoritesContainer = document.getElementById("articles-container"); // Ensure you have this in HTML
    favoritesContainer.innerHTML = ""; // Clear previous content

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

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
                <a class="read-more-btn" href="${newsItem.url}" target="_blank">Read More</a>
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

// Function to remove news from favorites
function removeFromFavorites(index) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    favorites.splice(index, 1); // Remove the selected news
    localStorage.setItem("favorites", JSON.stringify(favorites));

    loadFavorites(); // Refresh the favorites section
}

// Load favorites when the page loads
document.addEventListener("DOMContentLoaded", loadFavorites);

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