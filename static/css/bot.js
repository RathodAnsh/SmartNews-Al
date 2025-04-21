document.addEventListener('DOMContentLoaded', () => {
    // Generate a unique session ID
    let currentSessionId = 'session-' + Math.random().toString(36).substr(2, 9);
    let currentNewsUrl = null;
    let currentSpeech = null;
    let speechSynthesisSupported = false;
    let voicesReady = false;
    let voicesLoaded = false;
    let voiceSupportChecked = false;

    // Get URL parameter
    function getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // DOM Elements
    const messageInput = document.getElementById('messageInput');
    const chatForm = document.getElementById('chatForm');
    const messagesContainer = document.getElementById('messages');
    const sendButton = document.querySelector('.send-btn');
    currentNewsUrl = getUrlParameter('url');

    // Enable text input by default
    messageInput.disabled = false;
    sendButton.disabled = false;

    // Initialize speech synthesis with better detection and fallbacks
    function initializeSpeech() {
        // Check if speech synthesis is supported
        speechSynthesisSupported = 'speechSynthesis' in window;
        voiceSupportChecked = true;
        
        if (!speechSynthesisSupported) {
            console.warn('Speech Synthesis API not supported in this browser');
            updateAllVoiceButtons();
            return;
        }

        // Try to load voices immediately
        try {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                voicesReady = true;
                voicesLoaded = true;
                updateAllVoiceButtons();
                return;
            }
        } catch (error) {
            console.error('Error accessing voices:', error);
        }

        // Set up voiceschanged event handler
        window.speechSynthesis.onvoiceschanged = function() {
            if (!voicesLoaded) {
                voicesReady = true;
                voicesLoaded = true;
                window.speechSynthesis.onvoiceschanged = null;
                updateAllVoiceButtons();
            }
        };

        // Fallback timeout in case voices never load
        setTimeout(() => {
            if (!voicesLoaded) {
                voicesReady = true;
                console.warn('Voice loading timeout - using available voices');
                updateAllVoiceButtons();
            }
        }, 5000);
    }

    // Update all voice buttons based on current state
    function updateAllVoiceButtons() {
        document.querySelectorAll('.voice-btn').forEach(btn => {
            updateVoiceButtonState(btn);
        });
    }

    // Update a single voice button's state
    function updateVoiceButtonState(buttonElement, state) {
        if (!buttonElement) return;
        
        buttonElement.classList.remove('playing', 'error');
        buttonElement.disabled = false;

        switch (state) {
            case 'loading':
                buttonElement.innerHTML = 'Loading Voices...';
                buttonElement.disabled = true;
                break;
            case 'unsupported':
                buttonElement.innerHTML = 'Voice Not Supported';
                buttonElement.disabled = true;
                break;
            case 'no-voice':
                buttonElement.innerHTML = 'No Voice Available';
                buttonElement.disabled = true;
                break;
            case 'error':
                buttonElement.innerHTML = 'Error Occurred';
                buttonElement.classList.add('error');
                break;
            case 'speaking':
                buttonElement.innerHTML = `
                    <div class="loading-wave">
                        <span></span><span></span><span></span><span></span>
                    </div>`;
                break;
            case 'stop':
                buttonElement.innerHTML = `
                    <svg viewBox="0 0 24 24" width="14" height="14">
                        <path fill="currentColor" d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4-.91 7-4.49 7-8.77s-3-7.86-7-8.77zm-2 2.06v12.95c-2.5-.86-4.5-3.04-4.5-6.48s2-5.62 4.5-6.47zm-9 1.71v8.15h2v-8.15h-2z"/>
                    </svg>
                    Stop`;
                buttonElement.classList.add('playing');
                break;
            default: // 'ready'
                buttonElement.innerHTML = `
                    <svg viewBox="0 0 24 24" width="14" height="14">
                        <path fill="currentColor" d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z"/>
                    </svg>
                    Listen`;
        }
    }

    function resetVoiceButton(buttonElement) {
        updateVoiceButtonState(buttonElement, 'ready');
    }

    // Improved normalization for Indian languages
    function normalizeIndianText(text) {
        return text
            .replace(/([।॥])/g, '.')          // Convert Hindi/Marathi punctuation to periods
            .replace(/[^a-zA-Z0-9\u0900-\u097F\s.,!?]/g, '') // Remove unsupported characters
            .replace(/\s+/g, ' ')            // Replace multiple spaces with a single space
            .trim();
    }

    function getVoiceForText(text) {
        if (!speechSynthesisSupported || !voicesReady) return null;
        
        try {
            const voices = window.speechSynthesis.getVoices();
            if (!voices || voices.length === 0) return null;
    
            // More accurate Hindi detection with common words
            const isHindi = /[\u0900-\u097F]/.test(text) && 
                          /(हिंदी|हैं|की|के|होता|में|से|है|और|कर|या|तो|उस|इस|क्या|नहीं|हो|था)/.test(text);
            
            // More accurate Marathi detection with common words
            const isMarathi = /[\u0900-\u097F]/.test(text) && 
                            /(मराठी|आहे|चा|ची|ळ|ज्ञ|मध्ये|पण|आणि|हे|तो|हो|मी|तू|ती|नाही|असेल|आज)/.test(text);
    
            // Get all available Indian voices
            const indianVoices = voices.filter(v => 
                v.lang.includes('-IN') || v.name.includes('India')
            );
    
            // For Hindi - prioritize native Hindi voices
            if (isHindi) {
                const hindiVoice = indianVoices.find(v => 
                    v.lang.startsWith('hi') && (v.name.includes('Hindi') || v.name.includes('हिंदी'))
                );
                if (hindiVoice) {
                    console.log('Using Hindi voice:', hindiVoice.name);
                    return hindiVoice;
                }
            }
    
            // For Marathi - prioritize native Marathi voices
            if (isMarathi) {
                const marathiVoice = indianVoices.find(v => 
                    v.lang.startsWith('mr') && (v.name.includes('Marathi') || v.name.includes('मराठी'))
                );
                if (marathiVoice) {
                    console.log('Using Marathi voice:', marathiVoice.name);
                    return marathiVoice;
                }
            }
    
            // Fallback to Indian English if native voices not found
            const indianEnglish = indianVoices.find(v => 
                v.lang.startsWith('en') && v.name.includes('India')
            );
            if (indianEnglish) return indianEnglish;
    
            // Final fallback
            return voices.find(v => v.default) || voices[0];
        } catch (error) {
            console.error('Error getting voices:', error);
            return null;
        }
    }
    
    function detectLanguage(text) {
        // Detect Hindi
        if (/[\u0900-\u097F]/.test(text)) {
            return 'hi-IN'; // Hindi
        }
        // Detect Marathi
        if (/[\u0900-\u097F]/.test(text) && /(मराठी|आहे|चा|ची|मध्ये|पण|आणि|हे|तो|हो|मी|तू|ती|नाही)/.test(text)) {
            return 'mr-IN'; // Marathi
        }
        // Default to English
        return 'en-US';
    }

    // Robust speech function with error handling
    function speakText(text, buttonElement) {
        // Cancel if already speaking
        if (currentSpeech) {
            currentSpeech.pause();
            currentSpeech = null;
            resetVoiceButton(buttonElement);
            return;
        }
    
        updateVoiceButtonState(buttonElement, 'speaking');
    
        fetch('http://127.0.0.1:5000/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
            credentials: 'include' // Include credentials for CORS
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to generate speech');
            return response.blob();
        })
        .then(blob => {
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            currentSpeech = audio;
    
            audio.play();
            audio.onended = () => {
                currentSpeech = null;
                resetVoiceButton(buttonElement);
            };
        })
        .catch(error => {
            console.error('Speak text error:', error);
            updateVoiceButtonState(buttonElement, 'error');
        });
    }

    // Function to add voice button to bot messages
    function addVoiceButton(messageElement) {
        const messageContent = messageElement.querySelector('.message-content');
        const text = messageContent.textContent;
        
        const voiceContainer = document.createElement('div');
        voiceContainer.className = 'voice-container';
        
        const voiceButton = document.createElement('button');
        voiceButton.className = 'voice-btn';
        
        // Set initial state
        if (!voiceSupportChecked) {
            voiceButton.innerHTML = 'Checking Voice...';
            voiceButton.disabled = true;
        } else {
            updateVoiceButtonState(voiceButton, 'ready');
        }
        
        voiceButton.addEventListener('click', () => {
            speakText(text, voiceButton);
        });
        
        voiceContainer.appendChild(voiceButton);
        messageContent.appendChild(voiceContainer);
    }

    // Function to handle editing a user query
    function enableEdit(userMessageElement, originalMessage) {
        const messageContent = userMessageElement.querySelector('.message-content');
        const editContainer = document.createElement('div');
        editContainer.className = 'edit-mode';
        
        const editInput = document.createElement('textarea');
        editInput.className = 'edit-input';
        editInput.value = originalMessage;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'edit-buttons';
        
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-btn';
        cancelButton.textContent = 'Cancel';
        
        const saveButton = document.createElement('button');
        saveButton.className = 'save-btn';
        saveButton.textContent = 'Save';
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(saveButton);
        editContainer.appendChild(editInput);
        editContainer.appendChild(buttonContainer);
        
        // Replace message content with edit interface
        messageContent.innerHTML = '';
        messageContent.appendChild(editContainer);
        
        editInput.focus();
        
        const handleSave = async () => {
            const editedMessage = editInput.value.trim();
            if (!editedMessage) return;
            
            // Display the edited message
            messageContent.innerHTML = editedMessage;
            addEditButton(userMessageElement);
            
            // Remove the previous bot response
            const nextSibling = userMessageElement.nextElementSibling;
            if (nextSibling && nextSibling.classList.contains('message') && nextSibling.classList.contains('bot')) {
                nextSibling.remove();
            }

            // Add loading indicator
            const loadingElement = document.createElement('div');
            loadingElement.className = 'message bot loading';
            loadingElement.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">Typing...</div>
            `;
            messagesContainer.appendChild(loadingElement);

            try {
                const response = await fetch('http://127.0.0.1:5000/chatbot/query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: editedMessage,
                        news_url: currentNewsUrl,
                        session_id: currentSessionId
                    }),
                    credentials: 'include'
                });

                messagesContainer.removeChild(loadingElement);

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();

                // Display bot response
                const botMessageElement = document.createElement('div');
                botMessageElement.className = 'message bot';
                botMessageElement.innerHTML = `
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">${data.response || "No response received"}</div>
                `;
                messagesContainer.appendChild(botMessageElement);
                addVoiceButton(botMessageElement);

            } catch (error) {
                console.error('Error:', error);

                if (loadingElement.parentNode) {
                    messagesContainer.removeChild(loadingElement);
                }

                const errorElement = document.createElement('div');
                errorElement.className = 'message error';
                errorElement.innerHTML = `
                    <div class="message-avatar">⚠️</div>
                    <div class="message-content">
                        Failed to get response. ${error.message}
                    </div>
                `;
                messagesContainer.appendChild(errorElement);
            }

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };

        const handleCancel = () => {
            messageContent.innerHTML = originalMessage;
            addEditButton(userMessageElement);
        };

        saveButton.addEventListener('click', handleSave);
        cancelButton.addEventListener('click', handleCancel);
        
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
            }
            if (e.key === 'Escape') {
                handleCancel();
            }
        });
    }

    // Helper function to add edit button
    function addEditButton(userMessageElement) {
        const messageContent = userMessageElement.querySelector('.message-content');
        const originalMessage = messageContent.textContent;
        
        const editContainer = document.createElement('div');
        editContainer.className = 'edit-container';
        
        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75 1.84-1.83zM3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/>
            </svg>
            Edit
        `;
        
        editButton.addEventListener('click', () => {
            enableEdit(userMessageElement, originalMessage);
        });
        
        editContainer.appendChild(editButton);
        messageContent.appendChild(editContainer);
    }

    // Function to handle bot responses and add voice buttons
    function handleBotResponse(botMessage) {
        const botMessageElement = document.createElement('div');
        botMessageElement.className = 'message bot';
        botMessageElement.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">${botMessage}</div>
        `;
        messagesContainer.appendChild(botMessageElement);
        addVoiceButton(botMessageElement); // Add voice button to the bot message
    }

    // Update the fetch logic in chatForm submission to use handleBotResponse
    chatForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const userMessage = messageInput.value.trim();

        if (!userMessage) {
            messageInput.placeholder = 'Please write the query or question here.';
            messageInput.classList.add('error');
            setTimeout(() => {
                messageInput.placeholder = 'Type your message...';
                messageInput.classList.remove('error');
            }, 2000);
            return;
        }

        // Display user message
        const userMessageElement = document.createElement('div');
        userMessageElement.className = 'message user';
        userMessageElement.innerHTML = `
            <div class="message-content">${userMessage}</div>
            <div class="message-avatar">👤</div>
        `;
        messagesContainer.appendChild(userMessageElement);
        addEditButton(userMessageElement);
        messageInput.value = '';

        // Add loading indicator
        const loadingElement = document.createElement('div');
        loadingElement.className = 'message bot loading';
        loadingElement.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">Typing...</div>
        `;
        messagesContainer.appendChild(loadingElement);

        try {
            const response = await fetch('http://127.0.0.1:5000/chatbot/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: userMessage,
                    news_url: currentNewsUrl,
                    session_id: currentSessionId
                }),
                credentials: 'include' // Include credentials for CORS
            });

            messagesContainer.removeChild(loadingElement);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            // Use handleBotResponse to display bot response and add voice button
            handleBotResponse(data.response || "No response received");

        } catch (error) {
            console.error('Error:', error);

            if (loadingElement.parentNode) {
                messagesContainer.removeChild(loadingElement);
            }

            const errorElement = document.createElement('div');
            errorElement.className = 'message error';
            errorElement.innerHTML = `
                <div class="message-avatar">⚠️</div>
                <div class="message-content">
                    Failed to get response. ${error.message}
                </div>
            `;
            messagesContainer.appendChild(errorElement);
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });

    // Display welcome message
    const welcomeMessageElement = document.createElement('div');
    welcomeMessageElement.className = 'message bot';
    welcomeMessageElement.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">Hello! Welcome to Smart News Assistant. How can I help you today with this news article?</div>
    `;
    messagesContainer.appendChild(welcomeMessageElement);
    addVoiceButton(welcomeMessageElement);

    // Initialize speech synthesis after a slight delay to ensure DOM is ready
    setTimeout(() => {
        initializeSpeech();
    }, 100);
});