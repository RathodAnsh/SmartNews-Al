const pages = [
    {
        title: "About Us",
        content: "Welcome to Smart News, your go-to web app for staying informed with the latest and most relevant news. We use advanced AI algorithms to deliver personalized news tailored to your interests, ensuring you never miss a story that matters. Stay smart, stay updated, and explore the world with us!"
    },
    {
        title: "Our Mission",
        content: "Our mission is to provide AI-driven news recommendations that match your interests. With our smart technology, we ensure you receive updates on topics that truly matter to you, without the noise of irrelevant news."
    },
    {
        title: "Get Started",
        content: "Join us on this journey to explore news like never before. Stay informed, stay ahead, and make the most of our AI-powered news insights. Click the button below to get started!"
    }
];

let currentPage = 0;

const titleElement = document.querySelector('.content h2');
const contentElement = document.querySelector('.content p');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');

function updatePage() {
    titleElement.innerText = pages[currentPage].title;
    contentElement.innerText = pages[currentPage].content;

    prevButton.classList.toggle('hidden', currentPage === 0);
    nextButton.innerText = currentPage === pages.length - 1 ? "Get Started" : "Next ➤";
}

nextButton.addEventListener('click', () => {
    if (currentPage < pages.length - 1) {
        currentPage++;
        updatePage();
    } else {
        window.location.href = "index.html"; // Redirect to main dashboard
    }
});

prevButton.addEventListener('click', () => {
    if (currentPage > 0) {
        currentPage--;
        updatePage();
    }
});

updatePage();
