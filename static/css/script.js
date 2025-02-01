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
    
    if (data.articles) {
      bindData(data.articles);
    } else {
      console.error("No articles found.");
    }
  } catch (error) {
    console.error("Error fetching news:", error);
  }
}

function bindData(articles) {
  const cardsContainer = document.querySelector("#cards-container");
  const newsCardTemplate = document.querySelector("#template-news-card");

  cardsContainer.innerHTML = "";

  articles.forEach((article) => {
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
  newsDesc.innerHTML = article.description;

  const date = new Date(article.publishedAt).toLocaleString("en-us", {
    timeZone: "Asia/Jakarta"
  });

  newsSource.innerHTML = `${article.source.name} • ${date}`;
  cardClone.firstElementChild.addEventListener("click", () => {
    window.open(article.url, "_blank");
  });
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
