document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.getElementById('toggleSidebar');
    const messageInput = document.getElementById('messageInput');
    const chatForm = document.getElementById('chatForm');
    const messagesContainer = document.getElementById('messages');
    const voiceButton = document.getElementById('voiceButton');
    const historyList = document.getElementById('historyList');

    // Initial States
    let isSidebarOpen = true;
    let isRecording = false;

    // Chat History Data
    const chatHistory = [
        { 
            title: "Latest Headlines", 
            date: "Just now", 
            preview: "Breaking news and top stories from around the world..." 
        },
        { 
            title: "Tech Updates", 
            date: "2 hours ago", 
            preview: "Latest developments in AI and technology sector..." 
        },
        { 
            title: "Market Analysis", 
            date: "Today", 
            preview: "Global market trends and financial insights..." 
        },
        { 
            title: "Sports Coverage", 
            date: "Yesterday", 
            preview: "Latest scores, highlights, and sports analysis..." 
        }
    ];

    // Initialize chat history with animation
    function initializeChatHistory() {
        chatHistory.forEach((chat, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.style.opacity = '0';
            historyItem.style.transform = 'translateY(20px)';
            historyItem.innerHTML = `
                <h3>${chat.title}</h3>
                <p class="date">${chat.date}</p>
                <p class="preview">${chat.preview}</p>
            `;
            historyList.appendChild(historyItem);

            // Animate entry
            setTimeout(() => {
                historyItem.style.transition = 'all 0.3s ease';
                historyItem.style.opacity = '1';
                historyItem.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // Toggle sidebar with animation
    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
        sidebar.classList.toggle('collapsed');
        toggleButton.innerHTML = isSidebarOpen 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
    }

    // Add a message to the chat with animation
    function addMessage(text, isBot = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isBot ? 'bot' : 'user'}`;
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        
        let messageHTML = '';
        if (isBot) {
            messageHTML += `
                <div class="message-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><path d="M12 4h4"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                </div>
            `;
        }
        
        messageHTML += `<div class="message-content">${text}</div>`;
        messageDiv.innerHTML = messageHTML;
        
        messagesContainer.appendChild(messageDiv);

        // Animate message entry
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);
    }

    // Handle form submission with typing animation
    function handleSubmit(e) {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message) {
            addMessage(message, false);
            messageInput.value = '';
            messageInput.disabled = true;

            // Simulate bot typing
            const typingMessage = document.createElement('div');
            typingMessage.className = 'message bot';
            typingMessage.innerHTML = `
                <div class="message-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><path d="M12 4h4"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                </div>
                <div class="message-content">typing...</div>
            `;
            messagesContainer.appendChild(typingMessage);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Simulate bot response after typing
            setTimeout(() => {
                messagesContainer.removeChild(typingMessage);
                addMessage("I've found some relevant news articles for you. Would you like me to summarize them?", true);
                messageInput.disabled = false;
                messageInput.focus();
            }, 1500);
        }
    }

    // Enhanced voice input handling
    function handleVoiceInput() {
        const voiceBtn = document.getElementById('voiceButton');
        
        if (!isRecording) {
            // Start recording state
            isRecording = true;
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="6" fill="currentColor"/>
                </svg>
            `;
            
            // Add recording indicator message
            addMessage("Listening... Speak your message", true);
            
            // Simulate recording timeout
            setTimeout(() => {
                stopRecording();
            }, 5000); // 5 second timeout for demo
        } else {
            stopRecording();
        }
    }

    function stopRecording() {
        const voiceBtn = document.getElementById('voiceButton');
        isRecording = false;
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
        `;
        
        // Simulate voice processing
        addMessage("Processing your voice message...", true);
        
        setTimeout(() => {
            addMessage("I understood you want to know about the latest news. Let me fetch that for you.", true);
        }, 1500);
    }

    // Event Listeners
    toggleButton.addEventListener('click', toggleSidebar);
    chatForm.addEventListener('submit', handleSubmit);
    voiceButton.addEventListener('click', handleVoiceInput);

    // Initialize
    initializeChatHistory();
    addMessage("Welcome to Smart News! I'm your AI assistant, ready to help you stay informed with the latest news and updates. What topics interest you today?", true);
});