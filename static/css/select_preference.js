document.addEventListener('DOMContentLoaded', () => {
    const selectedCountries = new Set();
    const selectedDomains = new Set();

    // Handle country selection
    document.querySelectorAll('input[name="country"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const country = e.target.value;
            if (e.target.checked) {
                selectedCountries.add(country);
            } else {
                selectedCountries.delete(country);
            }
            console.log('Selected countries:', Array.from(selectedCountries));
        });
    });

    // Handle domain selection
    document.querySelectorAll('input[name="domain"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const domain = e.target.value;
            if (e.target.checked) {
                selectedDomains.add(domain);
            } else {
                selectedDomains.delete(domain);
            }
            console.log('Selected domains:', Array.from(selectedDomains));
        });
    });

    // Save preferences
    document.getElementById('next-button').addEventListener('click', async () => {
        const username = localStorage.getItem('username'); // Get the logged-in user's username

        if (!username) {
            alert("User not logged in!");
            window.location.href = "login.html";
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/savePreferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    countries: Array.from(selectedCountries),
                    domains: Array.from(selectedDomains)
                })
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('preferencesSaved', 'true'); // Set a flag in localStorage
                alert("Preferences saved successfully! Please log in to continue.");
                window.location.href = "login.html"; // Redirect to the login page
            } else {
                alert(result.error || "Failed to save preferences.");
            }
        } catch (error) {
            console.error("Error saving preferences:", error);
            alert("An error occurred. Please try again later.");
        }
    });
});