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

// Function to load favorite articles from localStorage
function loadFavorites() {
    const articlesContainer = document.getElementById('articles-container');
    articlesContainer.innerHTML = ""; // Clear previous content

    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    if (favorites.length === 0) {
        articlesContainer.innerHTML = "<p>No favorite articles yet.</p>";
        return;
    }

    favorites.forEach(news => {
        const articleCard = document.createElement('div');
        articleCard.classList.add('article-card');
        articleCard.innerHTML = `
            <div class="article-content">
                <img class="article-image" src="${news.image}" alt="${news.title}">
                <div class="article-details">
                    <div>
                        <div class="article-meta">${news.source}</div>
                        <h3 class="article-title">${news.title}</h3>
                        <p class="article-excerpt">${news.description}</p>
                    </div>
                    <div class="article-actions">
                        <button class="action-button remove-button" data-title="${news.title}">
                            <i data-lucide="trash-2"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Attach remove button event listener
        articleCard.querySelector('.remove-button').addEventListener('click', (event) => {
            const title = event.currentTarget.getAttribute('data-title');
            removeFavorite(title);
        });

        articlesContainer.appendChild(articleCard);
    });

    // Reinitialize Lucide icons for dynamically added content
    lucide.createIcons();
}

// Function to remove article from favorites
function removeFavorite(title) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites = favorites.filter(news => news.title !== title);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    loadFavorites(); // Reload the favorites section
}

// Load favorites on page load
document.addEventListener('DOMContentLoaded', loadFavorites);

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
