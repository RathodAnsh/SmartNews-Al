const API_KEY = "ea641ccea1a542c4b4804508afec633e";
const url = "https://newsapi.org/v2/everything";

window.addEventListener("load", () => fetchNews("India"));

function reload() {
  window.location.reload();
}

async function fetchNews(query) {
  try {
    const res = await fetch(`${url}?q=${query}&apiKey=${API_KEY}`);
    const data = await res.json();

    if (data.articles && data.articles.length > 0) {
      displayNews(removeDuplicates(data.articles));
    } else {
      showPopup(); // Show pop-up if no news is found
    }
  } catch (error) {
    console.error("Error fetching news:", error);
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

function displayNews(articles) {
  const cardsContainer = document.querySelector("#cards-container");
  const newsCardTemplate = document.querySelector("#template-news-card");

  cardsContainer.innerHTML = ""; // Clear previous news

  articles.forEach(article => {
    if (!article.urlToImage) return;
    const cardClone = newsCardTemplate.content.cloneNode(true);
    fillDataInCard(cardClone, article);
    cardsContainer.appendChild(cardClone);
  });
}

function fillDataInCard(cardClone, article) {
  const newsImg = cardClone.querySelector("#news-img");
  const newsTitle = cardClone.querySelector("#news-title");
  const newsDesc = cardClone.querySelector("#news-desc");
  const newsSource = cardClone.querySelector("#news-source");

  newsImg.src = article.urlToImage;
  newsTitle.innerHTML = article.title;
  newsDesc.innerHTML = article.description || "No description available.";

  const date = new Date(article.publishedAt).toLocaleString("en-us", {
    timeZone: "Asia/Jakarta"
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
          <p>No News Regarding Your Title</p>
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
