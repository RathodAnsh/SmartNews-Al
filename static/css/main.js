document.addEventListener('DOMContentLoaded', function() {
  const menuBtn = document.getElementById('menuBtn');
  const closeBtn = document.getElementById('closeBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  // Open sidebar
  menuBtn.addEventListener('click', function() {
      sidebar.classList.add('active');
      overlay.classList.add('active');
  });

  // Close sidebar
  function closeSidebar() {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
  }

  closeBtn.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  // Handle domain and country selection
  const domainSelect = document.getElementById('domainSelect');
  const countrySelect = document.getElementById('countrySelect');

  function handleNewsSelection() {
      const selectedDomain = domainSelect.value;
      const selectedCountry = countrySelect.value;
      console.log(`Selected Domain: ${selectedDomain}, Selected Country: ${selectedCountry}`);
      // Here you can add API call to fetch news based on selection
  }

  domainSelect.addEventListener('change', handleNewsSelection);
  countrySelect.addEventListener('change', handleNewsSelection);

  // Handle language selection
  const languageSelect = document.getElementById('languageSelect');
  languageSelect.addEventListener('change', function() {
      const selectedLanguage = languageSelect.value;
      console.log(`Selected Language: ${selectedLanguage}`);
      // Here you can add logic to change the application language
  });

  // Handle search
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.querySelector('.search-btn');

  function handleSearch() {
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
          console.log(`Searching for: ${searchTerm}`);
          // Here you can add API call to search news
      }
  }

  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
          handleSearch();
      }
  });
});