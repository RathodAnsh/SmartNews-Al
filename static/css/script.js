const API_KEY = "ea641ccea1a542c4b4804508afec633e"
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

// Update the fetchNews function to handle improved search
async function fetchNews(query, isSearch = false) {
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
}

// Update fillDataInCard function to handle image loading errors
function fillDataInCard(cardClone, article) {
  const newsImg = cardClone.querySelector("#news-img")
  const newsTitle = cardClone.querySelector("#news-title")
  const newsDesc = cardClone.querySelector("#news-desc")
  const newsSource = cardClone.querySelector("#news-source")
  const readMoreBtn = cardClone.querySelector(".read-more-btn")

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

function showPopup() {
  const popup = document.createElement("div")
  popup.classList.add("popup")
  popup.innerHTML = `
        <div class="popup-content">
            <span class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <p>No News Regarding Your Title.</p>
        </div>
    `
  document.body.appendChild(popup)
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
function createChatbotButton() {
  const button = document.createElement("div")
  button.className = "chatbot-button"
  button.innerHTML = '<i class="fas fa-robot"></i>'

  const popup = document.createElement("div")
  popup.className = "chatbot-popup"
  popup.innerHTML = `
        <span class="close-popup">&times;</span>
        <p>Our chatbot is currently under development. We're working hard to bring you an amazing conversational experience soon! 🚀</p>
    `

  document.body.appendChild(button)
  document.body.appendChild(popup)

  button.addEventListener("click", () => {
    popup.classList.toggle("show")
  })

  popup.querySelector(".close-popup").addEventListener("click", () => {
    popup.classList.remove("show")
  })
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI elements
  createScrollToTopButton()
  createChatbotButton()

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