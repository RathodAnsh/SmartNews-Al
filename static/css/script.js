const newsData = [
    {
      image: "../static/css/images/news-image1.jpg",
      title: "Breaking News Title 1",
      description: "This is a brief description of the first news. Stay informed with the latest updates.",
    },
    {
      image: "../static/css/images/news-image2.jpg",
      title: "Breaking News Title 2",
      description: "This is a brief description of the second news. Stay informed with the latest updates.",
    },
    {
      image: "../static/css/images/news-image3.jpg",
      title: "Breaking News Title 3",
      description: "This is a brief description of the third news. Stay informed with the latest updates.",
    },
    {
        image: "../static/css/images/news-image3.jpg",
        title: "Breaking News Title 3",
        description: "This is a brief description of the third news. Stay informed with the latest updates.",
    },
    {
        image: "../static/css/images/news-image3.jpg",
        title: "Breaking News Title 3",
        description: "This is a brief description of the third news. Stay informed with the latest updates.",
    },
  ];
  
  const newsSection = document.getElementById("news-section");
  
  newsData.forEach((news) => {
    const container = document.createElement("div");
    container.classList.add("news-container");
  
    container.innerHTML = `
      <div class="news-card">
        <div class="news-image-container">
          <img src="${news.image}" alt="${news.title}" class="news-image">
        </div>
        <div class="news-content">
          <h3 class="news-title">${news.title}</h3>
          <p class="news-description">${news.description}</p>
          <div class="news-actions">
            <button class="icon-button"><i class="fas fa-thumbs-up"></i></button>
            <button class="icon-button"><i class="fas fa-share"></i></button>
          </div>
        </div>
      </div>
    `;
  
    newsSection.appendChild(container);
  });
  