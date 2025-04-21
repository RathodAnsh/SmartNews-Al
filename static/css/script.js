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

const API_KEY = "b5eeaeb54ab04261b59cd85195fcbc7a"
const url = "https://newsapi.org/v2/everything"

let allNews = []
let displayedCount = 0
const initialNewsCount = 10
const loadMoreCount = 10

window.addEventListener("load", () => fetchNews("India", false))

function reload() {
  window.location.reload()
}

// Add this helper function to calculate relevance score
function calculateRelevanceScore(article, searchQuery) {
  const query = searchQuery.toLowerCase().trim();
  const title = article.title?.toLowerCase() || '';
  const description = article.description?.toLowerCase() || '';
  
  // Calculate match score
  let score = 0;
  
  // Title matches (highest priority)
  if (title.includes(query)) {
    score += 3;
  }
  
  // Description matches
  if (description.includes(query)) {
    score += 1;
  }
  
  // Individual word matches
  const queryWords = query.split(' ');
  queryWords.forEach(word => {
    if (title.includes(word)) score += 0.5;
    if (description.includes(word)) score += 0.2;
  });
  
  return score;
}

// const DISABLE_API_CALLS = true; // Set this to true to stop API calls

// Update the fetchNews function to handle improved search
async function fetchNews(query, isSearch = false) {
  // if (DISABLE_API_CALLS) {
  //   console.log("API calls are disabled. Skipping fetchNews.");
  //   return; // Exit the function early
  // }

  try {
    console.log("Fetching Fresh News from API");

    const today = new Date();
    const currentDate = today.toISOString().split("T")[0];
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    const pastDate = lastWeek.toISOString().split("T")[0];

    // For search queries, expand the search terms
    let searchQuery = query;
    if (isSearch) {
      // Add related terms for better results
      const queryTerms = {
        'fashion': 'fashion OR style OR trends OR clothing OR designer',
        'sports': 'sports OR cricket OR football OR games OR tournament',
        'tech': 'technology OR tech OR digital OR innovation OR software',
        // Add more mappings as needed
      };
      
      // Check if we have related terms for the query
      const lowerQuery = query.toLowerCase();
      for (const [key, value] of Object.entries(queryTerms)) {
        if (lowerQuery.includes(key)) {
          searchQuery = value;
          break;
        }
      }
    }

    console.log(`Fetching news from ${pastDate} to ${currentDate} for query: ${searchQuery}`);

    // Make two API calls for better coverage
    const [mainRes, additionalRes] = await Promise.all([
      // Main search with exact query
      fetch(`${url}?q=${query}&from=${pastDate}&to=${currentDate}&sortBy=publishedAt&language=en&apiKey=${API_KEY}`),
      // Additional search with expanded terms
      fetch(`${url}?q=${searchQuery}&from=${pastDate}&to=${currentDate}&sortBy=publishedAt&language=en&apiKey=${API_KEY}`)
    ]);

    const [mainData, additionalData] = await Promise.all([
      mainRes.json(),
      additionalRes.json()
    ]);

    // Combine and deduplicate articles
    const allArticles = [...(mainData.articles || []), ...(additionalData.articles || [])];
    const uniqueArticles = Array.from(
      new Map(allArticles.map(article => [article.title, article])).values()
    );

    if (uniqueArticles.length > 0) {
      // Filter articles with valid titles and images
      let validArticles = uniqueArticles.filter(article => 
        article.title && 
        article.urlToImage && 
        isValidImageUrl(article.urlToImage)
      );

      if (isSearch) {
        // Relaxed relevance threshold for search
        validArticles = validArticles
          .map(article => ({
            ...article,
            relevanceScore: calculateRelevanceScore(article, query)
          }))
          .filter(article => article.relevanceScore > 0.5) // Reduced threshold
          .sort((a, b) => b.relevanceScore - a.relevanceScore);
      }

      // Rest of your existing code...
      if (validArticles.length > 0) {
        // Separate current date and previous days news
        const todayStart = new Date(currentDate);
        const todayEnd = new Date(currentDate);
        todayEnd.setHours(23, 59, 59, 999);

        const currentDateNews = validArticles.filter(article => {
          const articleDate = new Date(article.publishedAt);
          return articleDate >= todayStart && articleDate <= todayEnd;
        });

        const previousNews = validArticles.filter(article => {
          const articleDate = new Date(article.publishedAt);
          return articleDate < todayStart && articleDate >= new Date(pastDate);
        });

        // Sort and combine as before
        currentDateNews.sort((a, b) => 
          new Date(b.publishedAt) - new Date(a.publishedAt)
        );
        previousNews.sort((a, b) => 
          new Date(b.publishedAt) - new Date(a.publishedAt)
        );

        const combinedArticles = [...currentDateNews, ...previousNews];
        allNews = prioritizeIndianNews(combinedArticles);
        console.log("Filtered and Prioritized News:", allNews);
        displayedCount = 0;
        displayNews(allNews.slice(0, initialNewsCount));
        updateLoadMoreButton();
      } else {
        showPopup();
      }
    } else {
      showPopup();
    }
  } catch (error) {
    console.error("Error fetching news:", error);
    showPopup();
  }
}

// Add this helper function to check if image URL is valid
function isValidImageUrl(url) {
  if (!url) return false
  return url.match(/\.(jpeg|jpg|gif|png)$/) != null || 
         url.includes('https://') || 
         url.includes('http://')
}

function prioritizeIndianNews(articles) {
  const indianNews = []
  const internationalNews = []
  
  // First separate Indian and International news
  articles.forEach(article => {
    if (
      article.source.name.toLowerCase().includes('india') || 
      article.url.includes('.in') ||
      article.title.toLowerCase().includes('india')
    ) {
      indianNews.push(article)
    } else {
      internationalNews.push(article)
    }
  })

  // Sort both arrays by date (newest first)
  indianNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  internationalNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

  // Calculate 80-20 split
  const totalNewsCount = articles.length
  const indianNewsCount = Math.ceil(totalNewsCount * 0.8)
  
  // Get top Indian news and rest international
  const selectedIndianNews = indianNews.slice(0, indianNewsCount)
  const selectedInternationalNews = internationalNews.slice(
    0, 
    totalNewsCount - indianNewsCount
  )

  // Combine and remove duplicates while preserving sources
  return removeDuplicates([...selectedIndianNews, ...selectedInternationalNews])
}

function removeDuplicates(articles) {
  const seenArticles = new Map()
  
  // Helper function to calculate string similarity
  function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0
    const words1 = str1.toLowerCase().trim().split(' ')
    const words2 = str2.toLowerCase().trim().split(' ')
    const commonWords = words1.filter(word => words2.includes(word))
    return (2.0 * commonWords.length) / (words1.length + words2.length)
  }

  // Helper function to generate article fingerprint
  function getArticleFingerprint(article) {
    return {
      title: article.title?.toLowerCase().trim() || '',
      source: article.source?.name?.toLowerCase().trim() || '',
      description: article.description?.toLowerCase().trim() || ''
    }
  }

  // Sort articles by date (newest first) before checking duplicates
  const sortedArticles = articles.sort((a, b) => 
    new Date(b.publishedAt) - new Date(a.publishedAt)
  )

  sortedArticles.forEach(article => {
    const currentArticle = getArticleFingerprint(article)
    let isDuplicate = false

    // Check for similar articles
    for (const [key, existingArticle] of seenArticles.entries()) {
      const existingFingerprint = getArticleFingerprint(existingArticle)
      
      // Calculate similarities
      const titleSimilarity = calculateSimilarity(
        currentArticle.title, 
        existingFingerprint.title
      )
      const sourceSimilarity = calculateSimilarity(
        currentArticle.source, 
        existingFingerprint.source
      )
      const descSimilarity = calculateSimilarity(
        currentArticle.description, 
        existingFingerprint.description
      )

      // Consider it duplicate if:
      // - Title similarity > 70% OR
      // - Same source AND description similarity > 60%
      if (titleSimilarity > 0.7 || 
          (sourceSimilarity > 0.9 && descSimilarity > 0.6)) {
        isDuplicate = true
        break
      }
    }

    // If not a duplicate, add to map using title as key
    if (!isDuplicate) {
      seenArticles.set(currentArticle.title, article)
    }
  })
  
  // Return unique articles sorted by date
  return Array.from(seenArticles.values())
}

// Update the displayNews function to initialize share buttons after adding cards
async function displayNews(articles) {
  const cardsContainer = document.querySelector("#cards-container")
  const newsCardTemplate = document.querySelector("#template-news-card")

  if (displayedCount === 0) {
    cardsContainer.innerHTML = ""
  }

  articles.forEach((article) => {
    const cardClone = newsCardTemplate.content.cloneNode(true)
    fillDataInCard(cardClone, article)
    cardsContainer.appendChild(cardClone)
  })

  displayedCount += articles.length
  
  // Initialize share buttons after adding new cards
  initializeShareButtons()
}

// Update fillDataInCard function to handle image loading errors
function fillDataInCard(cardClone, article) {
  const newsImg = cardClone.querySelector("#news-img")
  const newsTitle = cardClone.querySelector("#news-title")
  const newsDesc = cardClone.querySelector("#news-desc")
  const newsSource = cardClone.querySelector("#news-source")
  const readMoreBtn = cardClone.querySelector(".read-more-btn")
  readMoreBtn.href = article.url;
  // Add error handling for images
  newsImg.onerror = () => {
    newsImg.src = 'path/to/fallback/image.jpg' // Add a fallback image
    console.log(`Failed to load image for article: ${article.title}`)
  }
  
  newsImg.src = article.urlToImage
  newsTitle.innerText = article.title
  newsDesc.innerText = article.description || "No description available."

  const date = new Date(article.publishedAt).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  })

  newsSource.innerHTML = `${article.source.name} • ${date}`

  readMoreBtn.addEventListener("click", (event) => {
    event.stopPropagation()
    window.open(article.url, "_blank")
  })

  cardClone.firstElementChild.addEventListener("click", (event) => {
    event.preventDefault()
  })
}

// Update the loadMore function
function loadMore() {
  const remainingNews = allNews.slice(displayedCount, displayedCount + loadMoreCount)
  if (remainingNews.length > 0) {
    displayNews(remainingNews)
    updateLoadMoreButton()
  }
}

function updateLoadMoreButton() {
  const loadMoreContainer = document.querySelector(".load-more-container")
  if (!loadMoreContainer) {
    const container = document.createElement("div")
    container.className = "load-more-container"
    const button = document.createElement("button")
    button.className = "load-more-btn"
    button.textContent = "Load More"
    button.onclick = loadMore
    container.appendChild(button)
    document.querySelector("main").appendChild(container)
  }

  const button = document.querySelector(".load-more-btn")
  if (button) {
    button.style.display = displayedCount >= allNews.length ? "none" : "block"
  }
}

function showPopup(message) {
    const existingPopup = document.querySelector(".popup");
    if (existingPopup) {
        existingPopup.remove(); // Remove any existing popup
    }

    const popup = document.createElement("div");
    popup.classList.add("popup");
    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(popup);

    // Automatically remove the popup after 5 seconds
    setTimeout(() => {
        popup.remove();
    }, 5000);
}

// Search Bar Handling (Task 3: Fetching last 7 days news based on title match)
const searchButton = document.getElementById("search-button")
const searchText = document.getElementById("search-text")

// Update the handleSearch function
function handleSearch() {
  const query = searchText.value.trim();
  if (!query) return;

  // Add loading state
  searchButton.disabled = true;
  searchButton.textContent = 'Searching...';

  fetchNews(query, true).finally(() => {
    // Reset button state
    searchButton.disabled = false;
    searchButton.textContent = 'Search';
  });
}

searchButton.addEventListener("click", handleSearch)
searchText.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch()
  }
})

// Scroll to Top functionality
function createScrollToTopButton() {
  const button = document.getElementById("scrollToTop")
  button.className = "scroll-to-top"
  button.innerHTML = '<i class="fas fa-arrow-up"></i>'
  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  })
  document.body.appendChild(button)

  window.addEventListener("scroll", () => {
    const scrollButton = document.querySelector(".scroll-to-top")
    if (window.scrollY > 500) {
      scrollButton.classList.add("visible")
    } else {
      scrollButton.classList.remove("visible")
    }
  })
}

// Chatbot functionality
// function createChatbotButton() {
//   const button = document.createElement("div")
//   button.className = "chatbot-button"
//   button.innerHTML = '<i class="fas fa-robot"></i>'

//   document.body.appendChild(button)
//   document.body.appendChild(popup)

//   button.addEventListener("click", () => {
//     popup.classList.toggle("show")
//   })

//   popup.querySelector(".close-popup").addEventListener("click", () => {
//     popup.classList.remove("show")
//   })
// }

document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI elements
  createScrollToTopButton()

  function addToFavorites(newsCard) {
    const username = localStorage.getItem("username");
    if (!username) {
        alert("You need to log in to add favorites!");
        return;
    }

    const favoritesKey = `favorites_${username}`;
    let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];

    const newsItem = {
        image: newsCard.querySelector("#news-img").src,
        title: newsCard.querySelector("#news-title").textContent,
        source: newsCard.querySelector("#news-source").textContent,
        description: newsCard.querySelector("#news-desc").textContent,
        url: newsCard.querySelector("#news-url").href,
    };

    // Check if the news is already in favorites
    if (!favorites.some(fav => fav.url === newsItem.url)) {
        favorites.unshift(newsItem); // Add latest news at the beginning
        localStorage.setItem(favoritesKey, JSON.stringify(favorites));
        alert("News added to favorites!");
    } else {
        alert("This news is already in favorites!");
    }
}

// Event listener for Like button clicks
document.addEventListener("click", function (event) {
    if (event.target.closest(".like-btn")) {
        const newsCard = event.target.closest(".news-card");
        if (newsCard) {
            addToFavorites(newsCard);
        }
    }
});

  const categorySelect = document.getElementById("category-select")
  const countrySelect = document.getElementById("country-select")

  function handleCategoryChange() {
    const category = categorySelect.value
    const country = countrySelect.value
    const query = `${category} ${country}`.trim()

    fetchNews(query, false)
  }

  if (categorySelect && countrySelect) {
    categorySelect.addEventListener("change", handleCategoryChange)
    countrySelect.addEventListener("change", handleCategoryChange)
  } else {
    console.error("Category or Country select elements not found.")
  }
  const domainSelect = document.getElementById("domainSelect")
  const countrySelect2 = document.getElementById("countrySelect")

  function handleCategoryChange2() {
    const domain = domainSelect.value
    const country = countrySelect2.value
    const query = `${domain} ${country === "in" ? "India" : ""}`.trim()

    fetchNews(query, false)
  }

  if (domainSelect && countrySelect2) {
    domainSelect.addEventListener("change", handleCategoryChange2)
    countrySelect2.addEventListener("change", handleCategoryChange2)
  } else {
    console.error("Domain or Country select elements not found.")
  }
})

document.addEventListener("DOMContentLoaded", () => {
    const domainSelect = document.getElementById("domainSelect");
    const countrySelect = document.getElementById("countrySelect");

    function handleDomainCountryFilter() {
        const domain = domainSelect.value;
        const country = countrySelect.value;

        // Fetch and display news based on domain and country
        fetchNewsByDomainAndCountry(domain, country);
    }

    // Add event listeners to the dropdowns
    if (domainSelect && countrySelect) {
        domainSelect.addEventListener("change", handleDomainCountryFilter);
        countrySelect.addEventListener("change", handleDomainCountryFilter);
    } else {
        console.error("Domain or Country select elements not found.");
    }
});

// document.addEventListener("DOMContentLoaded", () => {
//     const categorySelect = document.getElementById("domainSelect");
//     const countrySelect = document.getElementById("countrySelect");

//     function handleCategoryChange() {
//         const category = categorySelect.value;
//         const country = countrySelect.value;

//         // Fetch news based on the selected category and country
//         fetchNewsByCategoryAndCountry(category, country);
//     }

//     if (categorySelect && countrySelect) {
//         categorySelect.addEventListener("change", handleCategoryChange);
//         countrySelect.addEventListener("change", handleCategoryChange);
//     } else {
//         console.error("Category or Country select elements not found.");
//     }
// });

// Add this function to handle share functionality
function initializeShareButtons() {
    document.querySelectorAll('.share-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log("Share button clicked");

            // Get the news card details
            const newsCard = this.closest('.news-card');
            if (!newsCard) {
                console.error("News card not found");
                return;
            }

            const newsUrl = newsCard.querySelector('.read-more-btn').href;
            const newsTitle = newsCard.querySelector('.news-title').textContent;

            // Validate URL before sharing
            if (!newsUrl || newsUrl === '#') {
                console.error('Invalid news URL');
                return;
            }

            console.log(`News URL: ${newsUrl}, News Title: ${newsTitle}`);

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
    });
}

function createShareMenu(url, title) {
    console.log("Creating share menu");
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
            icon: 'fab fa-twitter',
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
            console.log(`Opening ${option.name} share link`);
            window.open(option.url, '_blank');
            removeExistingShareMenus();
        });
        shareMenu.appendChild(shareOption);
    });

    // Add copy link option
    const copyOption = document.createElement('div');
    copyOption.className = 'share-option copy-link';
    copyOption.innerHTML = `
        <i class="fas fa-link"></i>
        <span>Copy Link</span>
    `;
    copyOption.addEventListener('click', () => {
        navigator.clipboard.writeText(url)
            .then(() => {
                console.log("Link copied to clipboard");
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

// Call this function after loading news cards
document.addEventListener('DOMContentLoaded', initializeShareButtons);

// Add this line where you create new news cards (if dynamic loading is implemented)
// initializeShareButtons();

async function fetchNewsByDomainAndCountry(domain, country) {
    try {
        console.log(`Fetching news for Domain: ${domain}, Country: ${country}`);

        const today = new Date();
        const currentDate = today.toISOString().split("T")[0];
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        const pastDate = lastWeek.toISOString().split("T")[0];

        // Construct the query based on domain and country
        let query = domain;
        if (country === "in") {
            query += " India";
        } else if (country === "ir") {
            query += " International";
        }

        // Fetch news from the API
        const response = await fetch(
            `${url}?q=${encodeURIComponent(query)}&from=${pastDate}&to=${currentDate}&sortBy=publishedAt&language=en&apiKey=${API_KEY}`
        );

        const data = await response.json();

        if (data.articles && data.articles.length > 0) {
            // Filter articles with valid titles and images
            const validArticles = data.articles.filter(
                (article) => article.title && article.urlToImage
            );

            // Display the filtered news
            displayFilteredNews(validArticles);
        } else {
            console.warn("No news found for the selected domain and country.");
            // Do not show the popup here
            console.log("No news found for the selected domain and country. Fallback to general news.");
            fetchGeneralNews(country); // Fallback to general news silently
        }
    } catch (error) {
        console.error("Error fetching news:", error);
        showPopup("Error fetching news. Please try again later.");
    }
}

async function fetchNewsByCategoryAndCountry(category, country) {
    try {
        console.log(`Fetching news for Category: ${category}, Country: ${country}`);

        // Map categories and countries to API-compatible values
        const categoryMapping = {
            business: "business",
            politics: "general",
            sports: "sports",
            technology: "technology",
            startups: "technology",
            science: "science",
            travel: "travel",
            fashion: "entertainment",
            entertainment: "entertainment",
        };

        const countryMapping = {
            in: "in", // India
            ir: "us", // International (default to US)
        };

        // Get the mapped values
        const apiCategory = categoryMapping[category.toLowerCase()] || "general";
        const apiCountry = countryMapping[country.toLowerCase()] || "us";

        // Construct the API URL
        const response = await fetch(
            `${url}?category=${apiCategory}&country=${apiCountry}&apiKey=${API_KEY}`
        );

        const data = await response.json();

        if (data.articles && data.articles.length > 0) {
            // Filter articles with valid titles and images
            const validArticles = data.articles.filter(
                (article) => article.title && article.urlToImage
            );

            // Display the filtered news
            displayFilteredNews(validArticles);
        } else {
            console.warn("No specific news found for the selected category and country.");
            // Do not show the popup here
            console.log("No specific news found. Fallback to general news.");
            fetchGeneralNews(country); // Fallback to general news silently
        }
    } catch (error) {
        console.error("Error fetching news:", error);
        showPopup("Error fetching news. Please try again later.");
    }
}

function displayFilteredNews(articles) {
    const cardsContainer = document.querySelector("#cards-container");
    const newsCardTemplate = document.querySelector("#template-news-card");

    // Clear existing news
    cardsContainer.innerHTML = "";

    if (articles.length === 0) {
        showPopup("No news articles available.");
        return;
    }

    // Add new articles
    articles.forEach((article) => {
        const cardClone = newsCardTemplate.content.cloneNode(true);
        fillDataInCard(cardClone, article);
        cardsContainer.appendChild(cardClone);
    });

    console.log("Filtered news displayed successfully.");

}

async function fetchGeneralNews(country) {
    try {
        console.log(`Fetching general news for Country: ${country}`);

        const countryMapping = {
            in: "in", // India
            ir: "us", // International (default to US)
        };

        const apiCountry = countryMapping[country.toLowerCase()] || "us";

        const response = await fetch(
            `${url}?country=${apiCountry}&apiKey=${API_KEY}`
        );

        const data = await response.json();

        if (data.articles && data.articles.length > 0) {
            // Filter articles with valid titles and images
            const validArticles = data.articles.filter(
                (article) => article.title && article.urlToImage
            );

            // Display the filtered news
            displayFilteredNews(validArticles);
        } else {
            console.warn("No general news found for the selected country.");
            showPopup("No general news found for the selected country.");
        }
    } catch (error) {
        console.error("Error fetching general news:", error);
        showPopup("Error fetching general news. Please try again later.");
    }
}

document.addEventListener("DOMContentLoaded", function () {
  const profileName = document.getElementById("profile-name");
  const profileSection = document.getElementById("profile-section");
  const profileIcon = document.getElementById("profile-icon");
  const dropdown = document.getElementById("dropdown");
  const logoutBtn = document.getElementById("logout");
  const loginIcon = document.getElementById("login-icon");

  // Generate a consistent and unique color based on user's name
function getFixedColor(name) {
  if (!name) return "#3498db"; // Default fallback color

  // List of distinct colors for different users
  const colors = [
      "#FF5733", "#33B5E5", "#33FF57", "#FFC300", "#FF33E5",
      "#8E44AD", "#E74C3C", "#3498db", "#F39C12", "#1ABC9C",
      "#2ECC71", "#9B59B6", "#D35400", "#C0392B", "#16A085",
      "#7D3C98", "#28B463", "#1F618D", "#F4D03F", "#C0392B"
  ];

  // Improved hash function using a larger prime multiplier
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 6) - hash);
  }

  // Ensure positive hash and map it to the color list
  const index = Math.abs(hash % colors.length);
  return colors[index];
}


  // Generate avatar with initials from name
  function generateAvatar(name) {
      if (!name) return "U"; // Default if no name
      return name.charAt(0).toUpperCase();
  }

  // Get username and name from localStorage after login
  const username = localStorage.getItem("username");
  const name = localStorage.getItem("name");

  if (username && name) {
      loginIcon.style.display = "none"; // Hide the login icon
      profileIcon.style.display = "flex"; // Show the profile info
      profileName.textContent = username; // Display username beside the icon
      const initials = generateAvatar(name); // Use name for avatar initials
      profileIcon.textContent = initials; // Set initials as profile icon
      profileIcon.style.backgroundColor = getFixedColor(username);

  }else {
    // User is not logged in
    loginIcon.style.display = "block"; // Show the login icon
    profileIcon.style.display = "none"; // Hide the profile info
    profileName.textContent = ""; // Clear the username
  }

  // Show/Hide dropdown when clicking on profile section (icon or name)
  profileSection.addEventListener("click", function (event) {
      event.stopPropagation();
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  });

  // Logout functionality
  logoutBtn.addEventListener("click", function () {
       // Clear user data from localStorage
       localStorage.removeItem("username");
       localStorage.removeItem("name");

       // Update the UI to reflect the logged-out state
       loginIcon.style.display = "block"; // Show the login icon
       profileIcon.style.display = "none"; // Hide the profile info
       profileName.textContent = ""; // Clear the username

       // Refresh the page to reflect the logged-out state
       window.location.reload();
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (event) {
      if (!profileSection.contains(event.target)) {
          dropdown.style.display = "none";
      }
  });
});

document.addEventListener("DOMContentLoaded", () => {
    const categorySelect = document.getElementById("domainSelect");
    const countrySelect = document.getElementById("countrySelect");

    function handleCategoryChange() {
        const category = categorySelect.value;
        const country = countrySelect.value;

        // Fetch news based on the selected category and country
        fetchNewsByCategoryAndCountry(category, country);
    }

    if (categorySelect && countrySelect) {
        categorySelect.addEventListener("change", handleCategoryChange);
        countrySelect.addEventListener("change", handleCategoryChange);
    } else {
        console.error("Category or Country select elements not found.");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const countries = JSON.parse(localStorage.getItem('countries'));
    const domains = JSON.parse(localStorage.getItem('domains'));

    console.log("User Preferences:", { countries, domains });
});

document.addEventListener('DOMContentLoaded', async () => {
    const username = localStorage.getItem('username');
    const countries = JSON.parse(localStorage.getItem('countries')) || [];
    const domains = JSON.parse(localStorage.getItem('domains')) || [];

    console.log("User Preferences:", { username, countries, domains });

    if (username && (countries.length > 0 || domains.length > 0)) {
        // User is logged in and has preferences
        console.log("Fetching news based on user preferences...");
        await fetchNewsByPreferences(countries, domains);
    } else {
        // User is not logged in or has no preferences
        console.log("Fetching general news...");
        await fetchGeneralNews();
    }

    // Initialize "Load More" button
    updateLoadMoreButton();
});

// Map user-selected domains and countries to API-compatible values
const domainMapping = {
    sports: "sports",
    politics: "general",
    technology: "technology",
    startups: "technology",
    science: "science",
    travel: "travel",
    fashion: "entertainment",
    entertainment: "entertainment",
};

const countryMapping = {
    in: "in", // India
    ir: "us", // International (default to US)
};

// Fetch news based on user preferences and include all general news
async function fetchNewsByPreferences(countries, domains) {
    try {
        const preferredNews = [];
        const generalNews = [];

        // Fetch news for each domain and country using the mapped values
        for (const domain of domains) {
            const apiDomain = domainMapping[domain.toLowerCase()] || "general";
            for (const country of countries) {
                const apiCountry = countryMapping[country.toLowerCase()] || "us";
                const news = await fetchNewsByDomainAndCountry(apiDomain, apiCountry);
                preferredNews.push(...news);
            }
        }

        // Fetch general news
        const allGeneralNews = await fetchGeneralNews();
        generalNews.push(...allGeneralNews);

        // Combine preferred and general news
        const combinedNews = prioritizePreferredNews(preferredNews, generalNews);

        // Remove duplicates
        const uniqueNews = removeDuplicates(combinedNews);

        // Display all news
        allNews = uniqueNews; // Populate the global `allNews` array
        displayedCount = 0; // Reset displayed count
        displayNews(allNews.slice(0, initialNewsCount));
        updateLoadMoreButton();
    } catch (error) {
        console.error("Error fetching news by preferences:", error);
    }
}

// Fetch general news (for non-logged-in users or fallback)
async function fetchGeneralNews() {
    try {
        console.log("Fetching general news...");

        const apiKey = 'b5eeaeb54ab04261b59cd85195fcbc7a'; // Replace with your NewsAPI key
        const response = await fetch(`https://newsapi.org/v2/top-headlines?language=en&apiKey=${apiKey}`);
        const data = await response.json();

        if (data.articles && data.articles.length > 0) {
            return data.articles.filter(article => article.title && article.urlToImage);
        } else {
            console.warn("No general news found.");
            return [];
        }
    } catch (error) {
        console.error("Error fetching general news:", error);
        return [];
    }
}

// Prioritize preferred news over general news
function prioritizePreferredNews(preferredNews, generalNews) {
    const preferredSet = new Set(preferredNews.map(article => article.title));
    const prioritizedNews = [...preferredNews];

    // Add general news that is not already in preferred news
    generalNews.forEach(article => {
        if (!preferredSet.has(article.title)) {
            prioritizedNews.push(article);
        }
    });

    return prioritizedNews;
}

// Fetch news for a specific domain and country
async function fetchNewsByDomainAndCountry(domain, country) {
    try {
        console.log(`Fetching news for Domain: ${domain}, Country: ${country}`);

        const apiKey = 'b5eeaeb54ab04261b59cd85195fcbc7a'; // Replace with your NewsAPI key
        const response = await fetch(`https://newsapi.org/v2/top-headlines?category=${domain}&country=${country}&apiKey=${apiKey}`);
        const data = await response.json();

        if (data.articles && data.articles.length > 0) {
            return data.articles.filter(article => article.title && article.urlToImage);
        } else {
            console.warn(`No news found for domain: ${domain} and country: ${country}`);
            return [];
        }
    } catch (error) {
        console.error("Error fetching news by domain and country:", error);
        return [];
    }
}

// Display news articles
function displayNews(articles) {
    const cardsContainer = document.querySelector("#cards-container");
    const newsCardTemplate = document.querySelector("#template-news-card");

    // Clear existing news if starting fresh
    if (displayedCount === 0) {
        cardsContainer.innerHTML = "";
    }

    articles.forEach(article => {
        const cardClone = newsCardTemplate.content.cloneNode(true);
        fillDataInCard(cardClone, article);
        cardsContainer.appendChild(cardClone);
    });

    displayedCount += articles.length;

    initializeShareButtons(); // Initialize share buttons for new cards
}

// Fill data into a news card
function fillDataInCard(cardClone, article) {
    const newsImg = cardClone.querySelector("#news-img");
    const newsTitle = cardClone.querySelector("#news-title");
    const newsDesc = cardClone.querySelector("#news-desc");
    const newsSource = cardClone.querySelector("#news-source");
    const readMoreBtn = cardClone.querySelector("#news-url");

    newsImg.src = article.urlToImage || "https://via.placeholder.com/400x200";
    newsTitle.textContent = article.title;
    newsDesc.textContent = article.description || "No description available.";
    newsSource.textContent = `${article.source.name} • ${new Date(article.publishedAt).toLocaleString()}`;
    readMoreBtn.href = article.url;
}

// Remove duplicate articles
function removeDuplicates(articles) {
    const seenTitles = new Set();
    return articles.filter(article => {
        if (seenTitles.has(article.title)) {
            return false;
        }
        seenTitles.add(article.title);
        return true;
    });
}

// Update the "Load More" button
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

// Load more news
function loadMore() {
    const remainingNews = allNews.slice(displayedCount, displayedCount + loadMoreCount);
    if (remainingNews.length > 0) {
        displayNews(remainingNews);
        updateLoadMoreButton();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".like-btn").forEach(button => {
        button.addEventListener("click", function () {
            const newsCard = this.closest(".news-card");
            if (!newsCard) return;

            const newsItem = {
                image: newsCard.querySelector("#news-img").src,
                title: newsCard.querySelector("#news-title").textContent,
                source: newsCard.querySelector("#news-source").textContent,
                description: newsCard.querySelector("#news-desc").textContent,
                url: newsCard.querySelector("#news-url").href,
            };

            const favoritesKey = `favorites_${localStorage.getItem("username")}`;
            let favorites = JSON.parse(localStorage.getItem(favoritesKey)) || [];

            // Check if the news item is already in favorites
            const isAlreadyFavorite = favorites.some(item => item.url === newsItem.url);
            if (isAlreadyFavorite) {
                console.log("This news is already in favorites.");
                return;
            }

            favorites.push(newsItem);
            localStorage.setItem(favoritesKey, JSON.stringify(favorites));
            console.log("News added to favorites:", newsItem);
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const profileButton = document.getElementById("profile-button"); // Profile/Favorites button
    const username = localStorage.getItem("username");
    const name = localStorage.getItem("name");

    profileButton.addEventListener("click", function () {
        if (!username || !name) {
            // User is logged out
            console.log("User is logged out. Redirecting to favorites page...");
            localStorage.setItem("guestMode", "true"); // Set guest mode
            window.location.href = "favourites.html"; // Redirect to favorites page
        } else {
            // User is logged in
            console.log("User is logged in. Redirecting to profile/favorites page...");
            window.location.href = "favourites.html"; // Redirect to favorites page
        }
    });
});


// const SESSION_TIMEOUT_DURATION = 2 * 60 * 1000; // 10 minutes
// const WARNING_BEFORE_TIMEOUT = 1 * 60 * 1000; // 1 minute before timeout
// let sessionTimeout;
// let warningTimeout;

// // Function to start the session timeout
// function startSessionTimeout() {
//     clearTimeout(sessionTimeout); // Clear any existing timeout
//     clearTimeout(warningTimeout); // Clear any existing warning timeout

//     // Show a warning 1 minute before the session times out
//     warningTimeout = setTimeout(() => {
//         alert("You will be logged out in 1 minute due to inactivity.");
//     }, SESSION_TIMEOUT_DURATION - WARNING_BEFORE_TIMEOUT);

//     // Log out the user after the session timeout duration
//     sessionTimeout = setTimeout(() => {
//         console.log("Session timed out. Logging out...");
//         logoutUser(); // Automatically log out the user
//     }, SESSION_TIMEOUT_DURATION);
// }

// // Function to clear the session timeout
// function clearSessionTimeout() {
//     clearTimeout(sessionTimeout);
//     clearTimeout(warningTimeout);
// }

// // Function to log out the user
// function logoutUser() {
//     // Clear user data from localStorage
//     localStorage.removeItem("username");
//     localStorage.removeItem("name");
//     localStorage.removeItem("email")
//     localStorage.setItem("guestMode", "true"); // Set guest mode

//     // Refresh the page to reflect the logged-out state
//     window.location.reload();
// }

// // Attach event listeners to reset the session timeout on user activity
// document.addEventListener("mousemove", startSessionTimeout);
// document.addEventListener("keydown", startSessionTimeout);

// // Start the session timeout when the page loads
// document.addEventListener("DOMContentLoaded", function () {
//     const username = localStorage.getItem("username");
//     const name = localStorage.getItem("name");

//     if (username && name) {
//         console.log("User is logged in. Starting session timeout...");
//         startSessionTimeout(); // Start the session timeout for logged-in users
//     }
// });

// document.addEventListener("DOMContentLoaded", function () {
//     // Check if the user is logged in
//     const isLoggedIn = localStorage.getItem("username") && localStorage.getItem("name");

//     // Add event listener for Like button
//     document.addEventListener("click", function (event) {
//         if (event.target.closest(".like-btn")) {
//             if (!isLoggedIn) {
//                 showPopup("To access all features, please log in or sign up.");
//                 event.preventDefault(); // Prevent the default action
//                 return;
//             }
//             // Add to favorites logic here (if logged in)
//             const newsCard = event.target.closest(".news-card");
//             if (newsCard) {
//                 addToFavorites(newsCard);
//             }
//         }
//     });

//     // Add event listener for Share button
//     document.addEventListener("click", function (event) {
//         if (event.target.closest(".share-btn")) {
//             if (!isLoggedIn) {
//                 showPopup("To access all features, please log in or sign up.");
//                 event.preventDefault(); // Prevent the default action
//                 return;
//             }
//             // Share logic here (if logged in)
//             console.log("Share button clicked.");
//         }
//     });

//     // Add event listener for Summarize button
//     document.addEventListener("click", function (event) {
//         if (event.target.closest(".summarize-btn")) {
//             if (!isLoggedIn) {
//                 showPopup("To access all features, please log in or sign up.");
//                 event.preventDefault(); // Prevent the default action
//                 return;
//             }
//             // Summarize logic here (if logged in)
//             console.log("Summarize button clicked.");
//         }
//     });
// });