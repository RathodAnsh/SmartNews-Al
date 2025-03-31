document.addEventListener("DOMContentLoaded", () => {
    const searchButton = document.getElementById("search-button");
    const searchText = document.getElementById("search-text");
    const cardsContainer = document.getElementById("cards-container");
    const loadingSpinner = document.getElementById("loading-spinner");
    const noResultsMessage = document.getElementById("no-results");

    const username = localStorage.getItem("username");
    const name = localStorage.getItem("name");

    function showLoading() {
        // Clear previous content and show loading spinner
        cardsContainer.innerHTML = `
            <div class="loading-spinner" style="display: flex;">
                <div class="spinner"></div>
                <div class="loading-text">Searching for news...</div>
            </div>
        `;
        
        // Disable search input and button while loading
        searchButton.disabled = true;
        searchText.disabled = true;
        
        // Update button text to show loading state
        searchButton.innerHTML = `
            <i data-lucide="loader-2" class="animate-spin"></i>
            Searching...
        `;
        
        // Refresh Lucide icons
        lucide.createIcons();
    }

    function hideLoading() {
        // Re-enable search input and button
        searchButton.disabled = false;
        searchText.disabled = false;
        
        // Restore button text
        searchButton.innerHTML = `
            <i data-lucide="search"></i>
            Search
        `;
        
        // Refresh Lucide icons
        lucide.createIcons();
    }

    function showNoResults() {
        cardsContainer.innerHTML = `
            <div class="no-results">
                <i data-lucide="search-x"></i>
                <h3>No news articles found</h3>
                <p>Try a different search term</p>
            </div>
        `;
        lucide.createIcons();
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function shortenText(text, maxLength = 450) {
        if (!text || typeof text !== 'string') return '';
        
        // Clean up the text first
        text = text.replace(/\s+/g, ' ').trim();
        text = text.replace(/\[\+\d+ chars\]/g, ''); // Remove unnecessary "[+1231 chars]" text
        
        // Return full text if it's short enough
        if (text.length <= maxLength) return text;
        
        // Find the last space before maxLength
        let shortened = text.substr(0, maxLength);
        let lastSpace = shortened.lastIndexOf(' ');
        
        // If we found a space and it's not too far from maxLength
        if (lastSpace > 0 && lastSpace > maxLength * 0.8) {
            shortened = shortened.substr(0, lastSpace);
        }
        
        // Add ellipsis if we shortened the text
        if (shortened.length < text.length) {
            shortened += '...';
        }
        
        return shortened;
    }

    async function fetchHistoricalNews(query) {
        showLoading();
        
        try {
            const response = await fetch(`http://127.0.0.1:5002/search?q=${encodeURIComponent(query)}`, {
                method: 'GET',
                mode: 'cors'
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data = await response.json();
            
            // Artificial delay to show loading state (remove in production)
            await new Promise(resolve => setTimeout(resolve, 800));
            
            hideLoading();
    
            if (data.results && data.results.length > 0) {
                displayNews(data.results);
            } else {
                showNoResults();
            }
        } catch (error) {
            console.error("Error fetching historical news:", error);
            hideLoading();
            cardsContainer.innerHTML = `
                <div class="no-results">
                    <i data-lucide="alert-circle"></i>
                    <h3>Error loading news</h3>
                    <p>Please try again later</p>
                </div>
            `;
            lucide.createIcons();
        }
    }

    function displayNews(articles) {
        cardsContainer.innerHTML = "";
        const template = document.getElementById("template-news-card");

        // Filter out articles with special characters in the title or description
        const filteredArticles = articles.filter(article => {
            const specialCharRegex = /[#\$%]/; // Regex to match #, $, or %
            return !specialCharRegex.test(article.title || "") && !specialCharRegex.test(article.text || "");
        });

        filteredArticles.forEach(article => {
            const newsCard = template.content.cloneNode(true);

            // Get all elements
            const newsTitle = newsCard.querySelector("#news-title");
            const newsMeta = newsCard.querySelector("#news-meta");
            const newsDesc = newsCard.querySelector("#news-desc");
            const newsUrl = newsCard.querySelector("#news-url");

            // Set content with fallback values
            newsTitle.textContent = article.title || "No title available";
            newsMeta.textContent = `${article.source_name || "Unknown source"} • ${formatDate(article.publishedDate || "Unknown date")}`;
            newsDesc.textContent = shortenText(article.text || "No description available", 150); // Limit description to 150 characters
            newsUrl.href = article.url || "#";
            newsUrl.innerHTML = `Read More <i data-lucide="arrow-right" class="icon-xs"></i>`;

            cardsContainer.appendChild(newsCard);
        });

        // Initialize icons
        lucide.createIcons();
        initializeShareButtons(); // Initialize share buttons after rendering cards
        initializeFavoriteButtons(); // Initialize favorite buttons after rendering cards
    
    }

    function handleSearch() {
        const query = searchText.value.trim();
        if (query) {
            fetchHistoricalNews(query);
        } else {
            cardsContainer.innerHTML = `
                <div class="no-results">
                    <i data-lucide="search"></i>
                    <h3>Please enter a search term</h3>
                    <p>Try searching for news about a specific topic</p>
                </div>
            `;
            lucide.createIcons();
        }
    }

    // Function to get the current user's favorites key
    function getFavoritesKey() {
        if (!username) {
            console.error("User not logged in!");
            return null;
        }
        return `favorites_${username}`;
    }

    // Function to add an article to the user's favorites
    function addToFavorites(newsItem) {
        const favoritesKey = getFavoritesKey();
        if (!favoritesKey) return;

        let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];
        if (!favorites.some(fav => fav.title === newsItem.title)) {
            favorites.push(newsItem);
            localStorage.setItem(favoritesKey, JSON.stringify(favorites));
            alert("Article added to favorites!");
        } else {
            alert("This article is already in your favorites!");
        }
    }

    // Initialize favorite buttons
    function initializeFavoriteButtons() {
        document.querySelectorAll(".action-btn").forEach(button => {
            // Ensure the button is the favorite button
            if (button.querySelector(".fa-heart")) {
                button.addEventListener("click", function (e) {
                    e.stopPropagation();

                    // Get the news card details
                    const newsCard = this.closest(".news-card");
                    const newsItem = {
                        title: newsCard.querySelector("#news-title").textContent,
                        meta: newsCard.querySelector("#news-meta").textContent,
                        description: newsCard.querySelector("#news-desc").textContent,
                        source: newsCard.querySelector("#news-meta").textContent.split(" • ")[0] || "Unknown source",
                        url: newsCard.querySelector("#news-url").href
                    };

                    console.log("Adding to favorites:", newsItem);

                    // Add to favorites in localStorage
                    addToFavorites(newsItem);

                    // Provide feedback to the user
                    this.querySelector(".fa-heart").classList.add("fas"); // Change to solid heart
                });
            }
        });
    }

    function initializeShareButtons() {
        document.querySelectorAll('.action-btn').forEach(button => {
            // Ensure the button is the share button
            if (button.querySelector('.fa-share')) {
                button.addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    // Get the news card details
                    const newsCard = this.closest('.news-card');
                    const newsUrl = newsCard.querySelector('#news-url').href;
                    const newsTitle = newsCard.querySelector('#news-title').textContent;
                    
                    // Validate URL before sharing
                    if (newsUrl === '#' || !newsUrl) {
                        console.error('Invalid news URL');
                        return;
                    }
                    
                    // Remove any existing share menus
                    removeExistingShareMenus();
                    
                    // Create and show the share menu
                    const shareMenu = createShareMenu(newsUrl, newsTitle);
                    
                    // Position the menu next to the share button
                    const buttonRect = this.getBoundingClientRect();
                    shareMenu.style.top = `${buttonRect.bottom + window.scrollY + 5}px`;
                    shareMenu.style.left = `${buttonRect.left}px`;
                    
                    // Add overlay
                    const overlay = document.createElement('div');
                    overlay.className = 'share-menu-overlay';
                    document.body.appendChild(overlay);
                    overlay.style.display = 'block';
                    
                    // Close menu when clicking outside
                    overlay.addEventListener('click', removeExistingShareMenus);
                });
            }
        });
    }

    function createShareMenu(url, title) {
        const shareMenu = document.createElement('div');
        shareMenu.className = 'share-menu';
        
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);
        
        const shareOptions = [
            {
                name: 'WhatsApp',
                icon: 'fab fa-whatsapp',
                url: `https://api.whatsapp.com/send?text=${encodedTitle}%0A${encodedUrl}`
            },
            {
                name: 'Telegram',
                icon: 'fab fa-telegram',
                url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
            },
            {
                name: 'X (Twitter)',
                icon: 'fab fa-x-twitter',
                url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
            },
            {
                name: 'LinkedIn',
                icon: 'fab fa-linkedin',
                url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
            }
        ];
        
        shareOptions.forEach(option => {
            const shareOption = document.createElement('div');
            shareOption.className = 'share-option';
            shareOption.innerHTML = `
                <i class="${option.icon}"></i>
                <span>${option.name}</span>
            `;
            shareOption.addEventListener('click', () => {
                window.open(option.url, '_blank');
                removeExistingShareMenus();
            });
            shareMenu.appendChild(shareOption);
        });
        
        const copyOption = document.createElement('div');
        copyOption.className = 'share-option copy-link';
        copyOption.innerHTML = `
            <i class="fas fa-link"></i>
            <span>Copy Link</span>
        `;
        copyOption.addEventListener('click', () => {
            navigator.clipboard.writeText(url)
                .then(() => {
                    copyOption.innerHTML = `
                        <i class="fas fa-check"></i>
                        <span>Copied!</span>
                    `;
                    setTimeout(() => {
                        copyOption.innerHTML = `
                            <i class="fas fa-link"></i>
                            <span>Copy Link</span>
                        `;
                        removeExistingShareMenus();
                    }, 2000);
                });
        });
        shareMenu.appendChild(copyOption);
        
        document.body.appendChild(shareMenu);
        setTimeout(() => shareMenu.classList.add('active'), 0);
        
        return shareMenu;
    }

    function removeExistingShareMenus() {
        document.querySelectorAll('.share-menu').forEach(menu => menu.remove());
        document.querySelectorAll('.share-menu-overlay').forEach(overlay => overlay.remove());
    }


    // Event Listeners
    searchButton.addEventListener("click", handleSearch);

    searchText.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    });

    // Initialize icons on page load
    lucide.createIcons();

    const profileName = document.getElementById("profile-name");
    const profileSection = document.getElementById("profile-section");
    const profileIcon = document.getElementById("profile-icon");
    // const dropdown = document.getElementById("dropdown");
    // const logoutBtn = document.getElementById("logout");
    const loginIcon = document.getElementById("login-icon");

    console.log("DOM fully loaded");

    // Generate a consistent and unique color based on the user's name
    function getFixedColor(name) {
        const colors = [
            "#FF5733", "#33B5E5", "#33FF57", "#FFC300", "#FF33E5",
            "#8E44AD", "#E74C3C", "#3498db", "#F39C12", "#1ABC9C",
            "#2ECC71", "#9B59B6", "#D35400", "#C0392B", "#16A085",
            "#7D3C98", "#28B463", "#1F618D", "#F4D03F", "#C0392B"
        ];
        const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }

    // Generate avatar with initials from the user's name
    function generateAvatar(name) {
        const initials = name
            .split(" ")
            .map(word => word[0].toUpperCase())
            .join("")
            .slice(0, 2); // Limit to 2 initials
        return initials;
    }

    

    

    if (username && name) {
        // Check if the required elements exist
        if (profileSection && profileIcon && profileName) {
            // Show the profile section and hide the login icon
            profileSection.style.display = "flex";
            if (loginIcon) loginIcon.style.display = "none";

            // Set the profile name
            profileName.textContent = username;

            // Generate and set the profile icon
            const backgroundColor = getFixedColor(name);
            const initials = generateAvatar(name);
            profileIcon.textContent = initials;
            profileIcon.style.backgroundColor = backgroundColor;
        }
    } else {
        // Show the login icon and hide the profile section
        if (profileSection) profileSection.style.display = "none";
        if (loginIcon) loginIcon.style.display = "flex";
    }
});

document.addEventListener("DOMContentLoaded", function () {
    
 // Initialize favorite buttons after rendering cards

    // // Get username and name from localStorage after login
    // const storedUsername = localStorage.getItem("username");
    // const storedName = localStorage.getItem("name");

    // if (storedUsername && storedName) {
    //     // Show the profile section and hide the login icon
    //     profileSection.style.display = "flex";
    //     loginIcon.style.display = "none";

    //     // Set the profile name
    //     profileName.textContent = storedName;

    //     // Generate and set the profile icon
    //     const backgroundColor = getFixedColor(storedName);
    //     const initials = generateAvatar(storedName);
    //     profileIcon.textContent = initials;
    //     profileIcon.style.backgroundColor = backgroundColor;
    // } else {
    //     // Show the login icon and hide the profile section
    //     profileSection.style.display = "none";
    //     loginIcon.style.display = "flex";
    // }

    // // Show/Hide dropdown when clicking on the profile section (icon or name)
    // profileSection.addEventListener("click", function (event) {
    //     event.stopPropagation();
    //     dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
    // });

    // // Logout functionality
    // logoutBtn.addEventListener("click", function () {
    //     // Clear user data from localStorage
    //     localStorage.removeItem("username");
    //     localStorage.removeItem("name");
    //     localStorage.removeItem("email");
    //     localStorage.setItem("guestMode", "true"); // Set guest mode

    //     // Redirect to the login page
    //     window.location.href = "login.html";
    // });

    // // Close dropdown when clicking outside
    // document.addEventListener("click", function (event) {
    //     if (!profileSection.contains(event.target)) {
    //         dropdown.style.display = "none";
    //     }
    // });
});