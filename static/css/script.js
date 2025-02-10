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

const API_KEY = "ea641ccea1a542c4b4804508afec633e";
const url = "https://newsapi.org/v2/everything";

let allNews = [];
let displayedCount = 0;
const initialNewsCount = 10;
const loadMoreCount = 10;

window.addEventListener("load", () => fetchNews("India", false));

function reload() {
    window.location.reload();
}

async function fetchNews(query, isSearch = false) {
    try {
        console.log("Fetching Fresh News from API");

        let today = new Date();
        let currentDate = today.toISOString().split("T")[0]; 
        let lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        let pastDate = lastWeek.toISOString().split("T")[0]; 

        let fromDate = pastDate;
        let toDate = currentDate;

        console.log(`Fetching news from ${fromDate} to ${toDate} for query: ${query}`);

        const res = await fetch(`${url}?q=${query}&from=${fromDate}&to=${toDate}&sortBy=publishedAt&language=en&apiKey=${API_KEY}`);
        const data = await res.json();

        console.log("API Response:", data);

        if (data.articles && data.articles.length > 0) {
            allNews = prioritizeIndianNews(data.articles.filter(article => article.urlToImage));
            console.log("Filtered and Prioritized News:", allNews);
            displayedCount = 0;
            displayNews(allNews.slice(0, initialNewsCount));
            updateLoadMoreButton();
        } else {
            console.log("No articles found for the query.");
            showPopup();
        }
    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

function prioritizeIndianNews(articles) {
    const indianNews = [];
    const internationalNews = [];
    const sourceCount = {};

    articles.forEach(article => {
        if (article.source.name.toLowerCase().includes("india") || article.url.includes(".in")) {
            indianNews.push(article);
        } else {
            internationalNews.push(article);
        }

        if (!sourceCount[article.source.name]) {
            sourceCount[article.source.name] = 0;
        }
        sourceCount[article.source.name]++;
    });

    // Ensure diverse sources
    indianNews.sort((a, b) => sourceCount[a.source.name] - sourceCount[b.source.name]);

    // Include some international news (20% of total international)
    const mixedNews = [...indianNews, ...internationalNews.slice(0, Math.ceil(internationalNews.length * 0.2))];
    
    return removeDuplicates(mixedNews);
}

function removeDuplicates(articles) {
    const seenTitles = new Set();
    return articles.filter(article => {
        if (!seenTitles.has(article.title)) {
            seenTitles.add(article.title);
            return true;
        }
        return false;
    });
}

async function displayNews(articles) {
    const cardsContainer = document.querySelector("#cards-container");
    const newsCardTemplate = document.querySelector("#template-news-card");

    if (displayedCount === 0) {
        cardsContainer.innerHTML = "";
    }

    articles.forEach(article => {
        const cardClone = newsCardTemplate.content.cloneNode(true);
        fillDataInCard(cardClone, article);
        cardsContainer.appendChild(cardClone);
    });

    displayedCount += articles.length;
}

function fillDataInCard(cardClone, article) {
    const newsImg = cardClone.querySelector("#news-img");
    const newsTitle = cardClone.querySelector("#news-title");
    const newsDesc = cardClone.querySelector("#news-desc");
    const newsSource = cardClone.querySelector("#news-source");
    const readMoreBtn = cardClone.querySelector(".read-more-btn");

    newsImg.src = article.urlToImage;
    newsTitle.innerText = article.title;
    newsDesc.innerText = article.description || "No description available.";
    
    const date = new Date(article.publishedAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata"
    });

    newsSource.innerHTML = `${article.source.name} • ${date}`;

    readMoreBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        window.open(article.url, "_blank");
    });

    cardClone.firstElementChild.addEventListener("click", (event) => {
        event.preventDefault();
    });
}

function loadMore() {
    const remainingNews = allNews.slice(displayedCount, displayedCount + loadMoreCount);
    if (remainingNews.length > 0) {
        displayNews(remainingNews);
        updateLoadMoreButton();
    }
}

function updateLoadMoreButton() {
    const loadMoreContainer = document.querySelector(".load-more-container");
    if (!loadMoreContainer) {
        const container = document.createElement("div");
        container.className = "load-more-container";
        const button = document.createElement("button");
        button.className = "load-more-btn";
        button.textContent = "Load More";
        button.onclick = loadMore;
        container.appendChild(button);
        document.querySelector("main").appendChild(container);
    }
    
    const button = document.querySelector(".load-more-btn");
    if (button) {
        button.style.display = displayedCount >= allNews.length ? "none" : "block";
    }
}

function showPopup() {
    const popup = document.createElement("div");
    popup.classList.add("popup");
    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <p>No News Regarding Your Title.</p>
        </div>
    `;
    document.body.appendChild(popup);
}

// Search Bar Handling (Task 3: Fetching last 7 days news based on title match)
const searchButton = document.getElementById("search-button");
const searchText = document.getElementById("search-text");

function handleSearch() {
    const query = searchText.value.trim();
    if (!query) return;

    fetchNews(query, true);
}

searchButton.addEventListener("click", handleSearch);
searchText.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        handleSearch();
    }
});

// Scroll to Top functionality
function createScrollToTopButton() {
    const button = document.getElementById("scrollToTop");
    button.className = "scroll-to-top";
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    button.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
    document.body.appendChild(button);

    window.addEventListener("scroll", () => {
        const scrollButton = document.querySelector(".scroll-to-top");
        if (window.scrollY > 500) {
            scrollButton.classList.add("visible");
        } else {
            scrollButton.classList.remove("visible");
        }
    });
}

// Chatbot functionality
function createChatbotButton() {
    const button = document.createElement("div");
    button.className = "chatbot-button";
    button.innerHTML = '<i class="fas fa-robot"></i>';
    
    const popup = document.createElement("div");
    popup.className = "chatbot-popup";
    popup.innerHTML = `
        <span class="close-popup">&times;</span>
        <p>Our chatbot is currently under development. We're working hard to bring you an amazing conversational experience soon! 🚀</p>
    `;
    
    document.body.appendChild(button);
    document.body.appendChild(popup);

    button.addEventListener("click", () => {
        popup.classList.toggle("show");
    });

    popup.querySelector(".close-popup").addEventListener("click", () => {
        popup.classList.remove("show");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Get the current page URL
    const currentPage = window.location.pathname.split("/").pop();

    // Select all nav links
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach(link => {
        // Get the href attribute of each link
        const linkPage = link.getAttribute("href");

        // Check if the link matches the current page
        if (linkPage === currentPage) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
        
        // Add click event listener to set active class when clicked
        link.addEventListener("click", function () {
            navLinks.forEach(nav => nav.classList.remove("active")); // Remove active class from all
            this.classList.add("active"); // Add active class to clicked one
        });
    });
    
    // Function to save news to localStorage
    function addToFavorites(newsItem) {
        let favorites = JSON.parse(localStorage.getItem("favorites")) || [];        
        favorites.push(newsItem);
        localStorage.setItem("favorites", JSON.stringify(favorites));
        alert("News added to favorites!");
    }

    // Add event listener to like button inside your card creation function
    function createNewsCard(article) {
        const cardClone = document.querySelector("#template-card").content.cloneNode(true);
        
        cardClone.querySelector("#news-title").innerText = article.title;
        cardClone.querySelector("#news-desc").innerText = article.description;
        cardClone.querySelector("#news-img").src = article.urlToImage;
        cardClone.querySelector("#news-source").innerText = article.source.name;
        
        // Handle Like Button Click
        cardClone.querySelector(".like-button").addEventListener("click", function (event) {
            event.stopPropagation();
            addToFavorites({
                title: article.title,
                description: article.description,
                image: article.urlToImage,
                source: article.source.name,
                url: article.url
            });
        });

        cardClone.firstElementChild.addEventListener("click", () => {
            window.open(article.url, "_blank");
        });

        document.querySelector("#news-container").appendChild(cardClone);
    }
    // Initialize UI elements
    createScrollToTopButton();
    createChatbotButton();

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