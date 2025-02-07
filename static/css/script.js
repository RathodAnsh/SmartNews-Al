const API_KEY = "ea641ccea1a542c4b4804508afec633e";
const url = "https://newsapi.org/v2/everything";

window.addEventListener("load", () => fetchNews("India", false));

function reload() {
  window.location.reload();
}

async function fetchNews(query, isSearch = false) {
  try {
    console.log("Fetching Fresh News from API");

    let today = new Date();
    let currentDate = today.toISOString().split("T")[0]; // Today's date
    let currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]; // First day of current month
    let previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split("T")[0]; // First day of previous month
    let lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    let pastDate = lastWeek.toISOString().split("T")[0]; // 7 days before today

    let fromDate = isSearch ? previousMonthStart : pastDate;
    let toDate = isSearch ? currentDate : currentDate; // Fetch up to today for current news

    const res = await fetch(`${url}?q=${query}&from=${fromDate}&to=${toDate}&sortBy=publishedAt&language=en&apiKey=${API_KEY}`);
    const data = await res.json();

    if (data.articles && data.articles.length > 0) {
      displayNews(filterNews(data.articles));
    } else {
      showPopup(); // Show pop-up if no news is found
    }
  } catch (error) {
    console.error("Error fetching news:", error);
  }
}

// Function to filter and prioritize current news
function filterNews(articles) {
  let indianNews = [];
  let internationalNews = [];
  let currentNews = [];

  articles.forEach(article => {
    const title = article.title.toLowerCase();
    const publishedDate = new Date(article.publishedAt).toISOString().split("T")[0];

    // Exclude non-English, non-Indian news like Spanish titles
    if (!/[\u00C0-\u00FF]/.test(title) && !title.includes("cómo") && !title.includes("esperes más")) {
      
      // Prioritize breaking news (current day first)
      if (publishedDate === new Date().toISOString().split("T")[0]) {
        currentNews.push(article);
      }
      // Categorize into Indian and International news
      else if (article.source.name.includes("India") || article.url.includes(".in")) {
        indianNews.push(article);
      } else {
        internationalNews.push(article);
      }
    }
  });

  // Include 80% Indian news, 20% international news
  let mixedNews = [...currentNews, ...indianNews, ...internationalNews.slice(0, Math.ceil(internationalNews.length * 0.2))];

  return removeDuplicates(mixedNews);
}

// Function to convert non-English news to English using Google Translate API
async function translateToEnglish(text) {
  try {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`);
    const data = await response.json();
    return data[0][0][0]; // Get translated text
  } catch (error) {
    console.error("Translation failed:", error);
    return text; // Return original text if translation fails
  }
}

// Function to remove duplicate news articles (checks both title & URL)
function removeDuplicates(articles) {
  const seenTitles = new Set();
  const seenUrls = new Set();

  return articles.filter(article => {
    if (!seenTitles.has(article.title) && !seenUrls.has(article.url)) {
      seenTitles.add(article.title);
      seenUrls.add(article.url);
      return true;
    }
    return false;
  });
}

async function displayNews(articles) {
  const cardsContainer = document.querySelector("#cards-container");
  const newsCardTemplate = document.querySelector("#template-news-card");

  cardsContainer.innerHTML = ""; // Clear previous news

  for (let article of articles) {
    if (!article.urlToImage) continue;
    
    // Translate non-English titles if needed
    const translatedTitle = await translateToEnglish(article.title);
    const translatedDesc = await translateToEnglish(article.description || "No description available.");

    const cardClone = newsCardTemplate.content.cloneNode(true);
    fillDataInCard(cardClone, article, translatedTitle, translatedDesc);
    cardsContainer.appendChild(cardClone);
  }
}

function fillDataInCard(cardClone, article, translatedTitle, translatedDesc) {
  const newsImg = cardClone.querySelector("#news-img");
  const newsTitle = cardClone.querySelector("#news-title");
  const newsDesc = cardClone.querySelector("#news-desc");
  const newsSource = cardClone.querySelector("#news-source");

  newsImg.src = article.urlToImage;
  newsTitle.innerHTML = translatedTitle;
  newsDesc.innerHTML = translatedDesc;

  const date = new Date(article.publishedAt).toLocaleString("en-us", {
    timeZone: "Asia/Kolkata"
  });

  newsSource.innerHTML = `${article.source.name} • ${date}`;
  cardClone.firstElementChild.addEventListener("click", () => {
    window.open(article.url, "_blank");
  });
}

// Function to show pop-up when no news is found
function showPopup() {
  const popup = document.createElement("div");
  popup.classList.add("popup");
  popup.innerHTML = `
      <div class="popup-content">
          <span class="close-btnn" onclick="this.parentElement.parentElement.remove()">&times;</span>
          <p>No News Regarding Your Title.</p>
      </div>
  `;
  document.body.appendChild(popup);
}

const searchButton = document.getElementById("search-button");
const searchText = document.getElementById("search-text");

// Function to handle the search action
function handleSearch() {
  const query = searchText.value.trim();
  if (!query) return;
  fetchNews(query);
}

// Event listener for button click
searchButton.addEventListener("click", handleSearch);

// Event listener for 'Enter' key press
searchText.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});