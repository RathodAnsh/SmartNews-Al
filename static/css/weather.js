// Initialize search functionality
const searchInput = document.getElementById('searchInput');
const locationBtn = document.querySelector('.location-btn');

// Add event listeners
searchInput.addEventListener('input', handleSearch);
locationBtn.addEventListener('click', getCurrentLocation);

// Search handler
function handleSearch(e) {
    const searchQuery = e.target.value;
    // This will be connected to the weather API later
    console.log('Searching for:', searchQuery);
}

// Get current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // This will be connected to the weather API later
                console.log('Current location:', { latitude, longitude });
            },
            (error) => {
                console.error('Error getting location:', error);
            }
        );
    } else {
        console.error('Geolocation is not supported by this browser.');
    }
}

// Update current time and date
function updateDateTime() {
    const dateElement = document.querySelector('.weather-info');
    const date = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    dateElement.firstElementChild.textContent = formattedDate;
}

// Initialize the date
updateDateTime();