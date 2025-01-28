// Initialize Lucide icons
lucide.createIcons();

// Get DOM elements
const searchInput = document.querySelector('.search-bar input');
const detailCards = document.querySelectorAll('.detail-card');
const forecastCards = document.querySelectorAll('.forecast-card');
const shareButton = document.querySelector('.share-button');

// Handle search input
searchInput.addEventListener('input', (e) => {
    const city = e.target.value;
    document.querySelector('.location').textContent = `${city}, IN`;
});

// Handle card hover effects
function handleCardHover(cards) {
    cards.forEach(card => {
        const icon = card.querySelector('[data-lucide]');
        
        card.addEventListener('mouseenter', () => {
            if (icon) {
                icon.style.transform = 'scale(1.25)';
                icon.style.transition = 'transform 0.3s';
            }
        });

        card.addEventListener('mouseleave', () => {
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    });
}

// Apply hover effects to cards
handleCardHover(detailCards);
handleCardHover(forecastCards);

// Handle share button click
shareButton.addEventListener('click', () => {
    // Add share functionality here
    alert('Share functionality will be implemented with the API integration');
});

// Update current time
function updateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    };
    const dateString = now.toLocaleDateString('en-US', options);
    document.querySelector('.date').textContent = dateString;
}

// Update time initially and every minute
updateTime();
setInterval(updateTime, 60000);

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';