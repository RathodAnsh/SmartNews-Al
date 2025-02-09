const quotes = [
    "Your Gateway to Global Stories",
    "Breaking News, Breaking Boundaries",
    "Where Information Meets Innovation"
];

document.addEventListener('DOMContentLoaded', () => {
    const content = document.querySelector('.content');
    const quoteElement = document.querySelector('.quote');
    let quoteIndex = 0;
    
    // Set initial quote
    quoteElement.textContent = quotes[0];
    
    // Rotate quotes with simple fade animation
    const quoteInterval = setInterval(() => {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        quoteElement.style.animation = 'none';
        quoteElement.offsetHeight; // Trigger reflow
        quoteElement.style.animation = null;
        quoteElement.textContent = quotes[quoteIndex];
    }, 3000);
    
    // Start fade out after 6 seconds
    setTimeout(() => {
        content.classList.add('fade-out');
    }, 6000);
    
    // Redirect to index.html after 7 seconds
    setTimeout(() => {
        window.location.href = "aboutus.html"; // Redirect to the main page
    }, 7000);
    
    return () => {
        clearInterval(quoteInterval);
    };
});
