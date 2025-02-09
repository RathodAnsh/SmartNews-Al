const quotes = [
    "Your Gateway to Global Stories",
    "Breaking News, Breaking Boundaries",
    "Where Information Meets Innovation"
];

document.addEventListener('DOMContentLoaded', () => {
    const content = document.querySelector('.content');
    const quoteElement = document.querySelector('.quote');
    const titleElement = document.querySelector('.title-typing');
    let quoteIndex = 0;
    
    // Create and animate title letters
    const titleText = 'SMART NEWS';
    titleText.split('').forEach((letter, index) => {
        const span = document.createElement('span');
        span.textContent = letter;
        span.classList.add('letter');
        
        // Add special class for first letters of each word
        if (index === 0 || index === 6) { // 'S' and 'N' positions
            span.classList.add('first-letter');
        }
        
        // Add different delays for more dynamic animation
        const baseDelay = index * 0.15;
        span.style.animationDelay = `${baseDelay}s`;
        
        titleElement.appendChild(span);
    });
    
    // Set initial quote with delay
    setTimeout(() => {
        quoteElement.textContent = quotes[0];
    }, 2000);
    
    // Rotate quotes with fade animation
    const quoteInterval = setInterval(() => {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        quoteElement.style.opacity = '0';
        quoteElement.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            quoteElement.textContent = quotes[quoteIndex];
            quoteElement.style.opacity = '1';
            quoteElement.style.transform = 'translateY(0)';
        }, 500);
    }, 3000);
    
    // Start fade out after 6 seconds
    setTimeout(() => {
        content.classList.add('fade-out');
    }, 6000);
    
    // Redirect after 7 seconds
    setTimeout(() => {
        console.log('Redirecting to main news page...');
        window.location.href = "aboutus.html";
    }, 7000);
    
    return () => {
        clearInterval(quoteInterval);
    };
});