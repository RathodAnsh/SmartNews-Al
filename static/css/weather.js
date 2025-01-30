// API key for OpenWeatherMap
const API_KEY = '341dd8df86f43dd79c9cb2a50f60482c';

// DOM elements
const searchInput = document.getElementById('searchInput');
const locationBtn = document.getElementById('locationBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const suggestions = document.getElementById('suggestions');

document.addEventListener('DOMContentLoaded', () => {
    const tempUnitRadios = document.querySelectorAll('input[name="temp-unit"]');
    const temperatureElements = document.querySelectorAll('.temperature'); // Assuming you have elements with class 'temperature'

    tempUnitRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const selectedUnit = document.querySelector('input[name="temp-unit"]:checked').value;
            temperatureElements.forEach(element => {
                const tempValue = parseFloat(element.textContent);
                if (selectedUnit === 'C') {
                    element.textContent = fahrenheitToCelsius(tempValue).toFixed(1) + '°C';
                } else {
                    element.textContent = celsiusToFahrenheit(tempValue).toFixed(1) + '°F';
                }
            });
        });
    });

    searchInput.addEventListener('input', () => {
        const query = searchInput.value;
        if (query.length >= 3) {
            fetchSuggestions(query);
        } else {
            suggestions.innerHTML = '';
        }
    });

    suggestions.addEventListener('click', (e) => {
        if (e.target.tagName === 'DIV') {
            searchInput.value = e.target.textContent;
            suggestions.innerHTML = '';
            fetchWeatherData(e.target.textContent);
        }
    });

    function fetchSuggestions(query) {
        fetch(`https://api.openweathermap.org/data/2.5/find?q=${query}&type=like&sort=population&cnt=5&appid=${API_KEY}`)
            .then(response => response.json())
            .then(data => {
                suggestions.innerHTML = data.list.map(city => `<div>${city.name}, ${city.sys.country}</div>`).join('');
            })
            .catch(error => console.error('Error fetching city suggestions:', error));
    }

    function celsiusToFahrenheit(celsius) {
        return (celsius * 9/5) + 32;
    }

    function fahrenheitToCelsius(fahrenheit) {
        return (fahrenheit - 32) * 5/9;
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Load default city (optional)
    // fetchWeatherData('London'); // Uncomment to load a default city

    // Add event listeners
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchWeatherData(searchInput.value);
        }
    });
    locationBtn.addEventListener('click', getCurrentLocation);
});

// Fetch weather data for a city
async function fetchWeatherData(city) {
    if (!city) {
        showError('Please enter a city name.');
        return;
    }

    try {
        showLoading();
        hideError();

        // Fetch current weather
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        const weatherData = await weatherResponse.json();

        if (weatherData.cod !== 200) {
            throw new Error(weatherData.message);
        }

        // Fetch forecast
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastResponse.json();

        if (forecastData.cod !== '200') {
            throw new Error(forecastData.message);
        }

        updateUI(weatherData, forecastData);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Fetch weather data using coordinates
async function fetchWeatherDataByCoords(lat, lon) {
    try {
        showLoading();
        hideError();

        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const weatherData = await weatherResponse.json();

        if (weatherData.cod !== 200) {
            throw new Error(weatherData.message);
        }

        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastResponse.json();

        if (forecastData.cod !== '200') {
            throw new Error(forecastData.message);
        }

        updateUI(weatherData, forecastData);
        searchInput.value = weatherData.name; // Set the input to the fetched city name
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Get current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherDataByCoords(latitude, longitude);
            },
            (error) => {
                showError('Unable to retrieve your location. Please enable location services.');
            }
        );
    } else {
        showError('Geolocation is not supported by this browser.');
    }
}

// Update UI with weather data
function updateUI(weatherData, forecastData) {
    // Update current weather
    document.getElementById('temperature').textContent = `${Math.round(weatherData.main.temp)}°C`;
    document.getElementById('weatherDescription').textContent = weatherData.weather[0].description;
    document.getElementById('date').textContent = formatDate(weatherData.dt);
    document.getElementById('location').textContent = `${weatherData.name}, ${weatherData.sys.country}`;

    // Update weather icon
    const weatherIcon = document.createElement('img');
    weatherIcon.src = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;
    weatherIcon.alt = weatherData.weather[0].description;
    document.getElementById('currentWeatherIcon').innerHTML = ''; // Clear previous icon
    document.getElementById('currentWeatherIcon').appendChild(weatherIcon);

    // Update weather details
    document.getElementById('feelsLike').textContent = `${Math.round(weatherData.main.feels_like)}°C`;
    document.getElementById('humidity').textContent = `${weatherData.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${weatherData.wind.speed} m/s`;
    document.getElementById('windDirection').style.transform = `rotate(${weatherData.wind.deg}deg)`;
    document.getElementById('pressure').textContent = `${weatherData.main.pressure} hPa`;
    document.getElementById('visibility').textContent = `${(weatherData.visibility / 1000).toFixed(1)} km`;

    // Update sunrise and sunset
    document.getElementById('sunrise').textContent = formatTime(weatherData.sys.sunrise, 'AM');
    document.getElementById('sunset').textContent = formatTime(weatherData.sys.sunset, 'PM');

    // Update forecast
    updateForecast(forecastData);
}

// Update forecast section
function updateForecast(forecastData) {
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';

    // Filter forecast data to get one entry per day
    const dailyForecasts = forecastData.list.filter((item, index) => index % 8 === 0);

    dailyForecasts.forEach(day => {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <p class="label">${formatDate(day.dt)}</p>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" 
                 alt="${day.weather[0].description}">
            <p class="value">${Math.round(day.main.temp)}°C</p>
            <p class="label">${day.weather[0].description}</p>
        `;
        forecastGrid.appendChild(forecastItem);
    });
}

// Utility functions
function formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(timestamp, period) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).replace('AM', period).replace('PM', period);
}

// Loading and error handling
function showLoading() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}