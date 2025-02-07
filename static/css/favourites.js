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

// Sample articles data
const favoriteArticles = [
    {
        id: 1,
        title: "India's New Navigation Satellite Is Stranded in the Wrong Orbit After Thruster Glitch",
        source: "Gizmodo.com",
        date: "2/4/2025, 12:50:01 AM",
        image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80",
        excerpt: "ISRO is exploring alternative uses for the satellite in its current orbit."
    },
    {
        id: 2,
        title: "How to Get Around the US TikTok Ban",
        source: "Wired",
        date: "1/19/2025, 12:39:26 PM",
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1674&q=80",
        excerpt: "TikTok is now unavailable in the United States—and getting around the ban isn't as simple as using a VPN. Here's what you need to know."
    }
];

// Function to create article cards
function createArticleCard(article) {
    return `
        <div class="article-card">
            <div class="article-content">
                <img 
                    class="article-image"
                    src="${article.image}"
                    alt="${article.title}"
                />
                <div class="article-details">
                    <div>
                        <div class="article-meta">
                            ${article.source} • ${article.date}
                        </div>
                        <h3 class="article-title">
                            ${article.title}
                        </h3>
                        <p class="article-excerpt">
                            ${article.excerpt}
                        </p>
                    </div>
                    <div class="article-actions">
                        <button class="action-button remove-button">
                            <i data-lucide="heart"></i>
                            Remove
                        </button>
                        <button class="action-button share-button">
                            <i data-lucide="share-2"></i>
                            Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render articles
function renderArticles() {
    const articlesContainer = document.getElementById('articles-container');
    articlesContainer.innerHTML = favoriteArticles.map(createArticleCard).join('');
    // Reinitialize icons for the newly added content
    lucide.createIcons();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    renderArticles();
});