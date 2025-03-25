document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.getElementById('toggleSidebar');
    const messageInput = document.getElementById('messageInput');
    const chatForm = document.getElementById('chatForm');
    const messagesContainer = document.getElementById('messages');
    const voiceButton = document.getElementById('voiceButton');
    const historyList = document.getElementById('historyList');
    const newChatBtn = document.getElementById('newChatBtn');
    const setupModal = document.getElementById('setupModal');
    const languageModal = document.getElementById('languageModal');
    const closeButton = document.getElementById('closeButton');
    const sendButton = document.querySelector('.send-btn');
    const importantNoteModal = document.getElementById('importantNoteModal');
    const inputMethodDropdown = document.getElementById('inputMethod');
    const languageDropdown = document.getElementById('languageSelection');
    const languageLabel = document.getElementById('languageLabel');

    // Initial States
    let isSidebarOpen = true;
    let isRecording = false;
    let inputMethod = null;
    let language = null;
    let isMuted = false;

    // Welcome messages in different languages
    const welcomeMessages = {
        english: "Welcome! How can I assist you today?",
        hindi: "नमस्ते! मैं आपकी कैसे मदद कर सकता हूं?",
        marathi: "नमस्कार! मी आपली कशी मदत करू शकतो?"
    };

    // Show important note modal on page load
    importantNoteModal.style.display = 'flex';

    // Automatically close the important note modal after 8 seconds
    setTimeout(() => {
        importantNoteModal.style.display = 'none';
        setupModal.style.display = 'flex';
    }, 8000);

    // Toggle sidebar functionality
    toggleButton.addEventListener('click', () => {
        isSidebarOpen = !isSidebarOpen;
        sidebar.classList.toggle('collapsed');
    });

    // Handle input method selection
    document.querySelectorAll('#modalOptions .option-btn').forEach(button => {
        button.addEventListener('click', function() {
            inputMethod = this.getAttribute('data-value');
            setupModal.style.display = 'none';

            if (inputMethod === 'text') {
                // Default language for text input is English
                language = 'english';
                messageInput.style.display = 'block';
                messageInput.disabled = false;
                sendButton.style.display = 'flex';
                sendButton.disabled = false;
                voiceButton.style.display = 'none';
                closeButton.style.display = 'none';

                // Show welcome message in English
                const welcomeMessageElement = document.createElement('div');
                welcomeMessageElement.className = 'message bot';
                welcomeMessageElement.innerHTML = `
                    <div class="message-avatar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 8V4H8"/>
                            <path d="M12 4h4"/>
                            <rect x="4" y="8" width="16" height="12" rx="2"/>
                            <path d="M2 14h2"/>
                            <path d="M20 14h2"/>
                            <path d="M15 13v2"/>
                            <path d="M9 13v2"/>
                        </svg>
                    </div>
                    <div class="message-content">
                        ${welcomeMessages[language]}
                    </div>
                `;
                messagesContainer.appendChild(welcomeMessageElement);
            } else if (inputMethod === 'voice') {
                // Show language selection modal for voice input
                languageModal.style.display = 'flex';
            }
        });
    });

    // Handle language selection for voice input
    document.querySelectorAll('#languageModal .option-btn').forEach(button => {
        button.addEventListener('click', function() {
            language = this.getAttribute('data-value');
            languageModal.style.display = 'none';

            // Configure voice input
            messageInput.style.display = 'none';
            sendButton.style.display = 'none';
            voiceButton.style.display = 'flex';
            voiceButton.disabled = false;
            closeButton.style.display = 'flex';
            closeButton.disabled = false;

            // Show welcome message in selected language
            const welcomeMessageElement = document.createElement('div');
            welcomeMessageElement.className = 'message bot';
            welcomeMessageElement.innerHTML = `
                <div class="message-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 8V4H8"/>
                        <path d="M12 4h4"/>
                        <rect x="4" y="8" width="16" height="12" rx="2"/>
                        <path d="M2 14h2"/>
                        <path d="M20 14h2"/>
                        <path d="M15 13v2"/>
                        <path d="M9 13v2"/>
                    </svg>
                </div>
                <div class="message-content">
                    ${welcomeMessages[language]}
                </div>
            `;
            messagesContainer.appendChild(welcomeMessageElement);

            showVoiceMode();
        });
    });

     // Add message to chat interface
     function addMessage(sender, message) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add(sender === "user" ? "user-message" : "bot-message");
        messageDiv.innerHTML = `<p>${message}</p>`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Handle form submission (for text input)
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const userMessage = messageInput.value.trim();
        if (userMessage !== "") {
            askQuestion(userMessage);
            messageInput.value = "";
        }

        // Create and display user message
        const userMessageElement = document.createElement('div');
        userMessageElement.className = 'message user';
        userMessageElement.innerHTML = `
            <div class="message-content">
                ${userMessage}
            </div>
            <div class="message-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
        `;
        messagesContainer.appendChild(userMessageElement);

        // Clear input
        messageInput.value = '';

        // Send the user's query to the Flask backend
        fetch('/chatbot/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: userMessage })
        })
        .then(response => response.json())
        .then(data => {
            // Display the bot's response
            const botMessageElement = document.createElement('div');
            botMessageElement.className = 'message bot';
            botMessageElement.innerHTML = `
                <div class="message-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 8V4H8"/>
                        <path d="M12 4h4"/>
                        <rect x="4" y="8" width="16" height="12" rx="2"/>
                        <path d="M2 14h2"/>
                        <path d="M20 14h2"/>
                        <path d="M15 13v2"/>
                        <path d="M9 13v2"/>
                    </svg>
                </div>
                <div class="message-content">
                    ${data.response}
                </div>
            `;
            messagesContainer.appendChild(botMessageElement);

            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

    // Handle new chat button
    newChatBtn.addEventListener('click', function() {
        // Reset chat and show setup modal
        messagesContainer.innerHTML = '';
        setupModal.style.display = 'flex';
        inputMethod = null;
        language = null;
        isRecording = false;
        
        // Reset input states
        messageInput.style.display = 'block';
        messageInput.disabled = true;
        voiceButton.style.display = 'none';
        closeButton.style.display = 'none';
        sendButton.style.display = 'none';
    });

    // Initialize chat history
    function initializeChatHistory() {
        historyList.innerHTML = '';
    }

    // Initialize
    initializeChatHistory();

    // Handle mute/unmute button
    voiceButton.addEventListener('click', () => {
        isMuted = !isMuted; // Toggle mute state
        voiceButton.classList.toggle('muted', isMuted); // Add/remove 'muted' class
        voiceButton.innerHTML = isMuted
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
               </svg>` // Mute icon
            : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="22"/>
               </svg>`; // Unmute icon
    });

    // Handle cancel button
    closeButton.addEventListener('click', () => {
        hideVoiceMode(); // Close the voice bot
        enableTextInput(); // Enable
    });

    // Show voice interaction mode
    function showVoiceMode() {
        const voiceModeOverlay = document.getElementById('voiceModeOverlay');
        const closeButton = document.getElementById('closeButton');
        const voiceButton = document.getElementById('voiceButton');

        voiceModeOverlay.style.display = 'flex'; // Show the overlay

        // Enable and display the Close and Mute buttons
        closeButton.style.display = 'flex';
        closeButton.disabled = false;
        voiceButton.style.display = 'flex';
        voiceButton.disabled = false;
    }

    // Hide voice interaction mode
    function hideVoiceMode() {
        const voiceModeOverlay = document.getElementById('voiceModeOverlay');
        voiceModeOverlay.style.display = 'none'; // Hide the overlay
    }

    
// Enable the text input bar
    function enableTextInput() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.querySelector('.send-btn');

        // Enable and display the text input bar
        messageInput.style.display = 'block';
        messageInput.disabled = false;
        sendButton.style.display = 'flex';
        sendButton.disabled = false;

        // Optionally, focus on the text input field
        messageInput.focus();
    }

    // Handle input method selection from dropdown
    inputMethodDropdown.addEventListener('change', function () {
        const selectedMethod = this.value;

        if (selectedMethod === 'text') {
            // Switch to text input
            languageDropdown.style.display = 'none';
            languageLabel.style.display = 'none';
            messageInput.style.display = 'block';
            messageInput.disabled = false;
            sendButton.style.display = 'flex';
            sendButton.disabled = false;
            voiceButton.style.display = 'none';
            closeButton.style.display = 'none';

            // Show welcome message for text input
            const welcomeMessageElement = document.createElement('div');
            welcomeMessageElement.className = 'message bot';
            welcomeMessageElement.innerHTML = `
                <div class="message-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 8V4H8"/>
                        <path d="M12 4h4"/>
                        <rect x="4" y="8" width="16" height="12" rx="2"/>
                        <path d="M2 14h2"/>
                        <path d="M20 14h2"/>
                        <path d="M15 13v2"/>
                        <path d="M9 13v2"/>
                    </svg>
                </div>
                <div class="message-content">
                    Welcome! How can I assist you today?
                </div>
            `;
            messagesContainer.appendChild(welcomeMessageElement);
        } else if (selectedMethod === 'voice') {
            // Switch to voice input
            languageDropdown.style.display = 'block';
            languageLabel.style.display = 'block';
        }
    });

    // Handle language selection for voice input
    languageDropdown.addEventListener('change', function () {
        const selectedLanguage = this.value;

        // Show welcome message in selected language
        const welcomeMessages = {
            english: "Welcome! How can I assist you today?",
            hindi: "नमस्ते! मैं आपकी कैसे मदद कर सकता हूं?",
            marathi: "नमस्कार! मी आपली कशी मदत करू शकतो?"
        };

        const welcomeMessageElement = document.createElement('div');
        welcomeMessageElement.className = 'message bot';
        welcomeMessageElement.innerHTML = `
            <div class="message-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 8V4H8"/>
                    <path d="M12 4h4"/>
                    <rect x="4" y="8" width="16" height="12" rx="2"/>
                    <path d="M2 14h2"/>
                    <path d="M20 14h2"/>
                    <path d="M15 13v2"/>
                    <path d="M9 13v2"/>
                </svg>
            </div>
            <div class="message-content">
                ${welcomeMessages[selectedLanguage]}
            </div>
        `;
        messagesContainer.appendChild(welcomeMessageElement);

        // Show voice bot
        showVoiceMode();
    });
});
