// DOM Element References
const aiCore = document.getElementById('ai-core');
const statusText = document.getElementById('status-text');
const transcriptContent = document.getElementById('transcript-content');
const textInput = document.getElementById('text-input');
const sendButton = document.getElementById('send-button');

// Speech Recognition and Synthesis Setup
let recognition;
let speechSynthesis = window.speechSynthesis;
let isListening = false;
let isProcessing = false;
let isToggleBlocked = false; // New safety flag

// Initialize Speech Recognition
function initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        updateStatus('Speech recognition not supported. Please use text input.');
        return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
        console.log("Microphone started");
        isListening = true;
        aiCore.classList.add('listening');
        updateStatus('Listening... Speak now.');
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        console.log('Recognized:', transcript);

        // Stop listening immediately after getting result
        isListening = false;
        aiCore.classList.remove('listening');

        if (transcript.trim()) {
            processTranscript(transcript);
        } else {
            updateStatus('No speech detected. Try again.');
        }
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);

        // Ignore 'no-speech' errors if we just clicked stop
        if (event.error === 'aborted') return;

        isListening = false;
        aiCore.classList.remove('listening');

        let errorMessage = 'Error: ';
        switch(event.error) {
            case 'network': errorMessage += 'Check connection.'; break;
            case 'not-allowed': errorMessage += 'Mic access denied.'; break;
            case 'no-speech': errorMessage += 'No speech heard.'; break;
            default: errorMessage += event.error;
        }
        updateStatus(errorMessage);
    };

    recognition.onend = function() {
        console.log("Microphone stopped");
        isListening = false;
        aiCore.classList.remove('listening');
        if (!isProcessing) {
            updateStatus('Ready to chat. Click the orb to start.');
        }
    };

    return true;
}

// Update Status Text
function updateStatus(message) {
    statusText.textContent = message;
}

// Add Message to Transcript
function addToTranscript(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const labelDiv = document.createElement('div');
    labelDiv.className = 'message-label';
    labelDiv.textContent = sender === 'user' ? 'You:' : 'Hrithik:';

    const contentDiv = document.createElement('div');
    contentDiv.textContent = message;

    messageDiv.appendChild(labelDiv);
    messageDiv.appendChild(contentDiv);
    transcriptContent.appendChild(messageDiv);

    transcriptContent.scrollTop = transcriptContent.scrollHeight;
}

// Process User Input
async function processTranscript(userMessage) {
    if (isProcessing) return;

    // Stop speaking if user interrupts by typing
    speechSynthesis.cancel();

    try {
        isProcessing = true;
        aiCore.classList.add('processing');
        updateStatus('Processing... Please wait.');

        addToTranscript(userMessage, 'user');

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userMessage })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const aiReply = data.reply;

        addToTranscript(aiReply, 'ai');
        speakText(aiReply);

    } catch (error) {
        console.error('Error processing request:', error);
        updateStatus('Error: Check connection.');
        addToTranscript('Sorry, I encountered an error processing your request.', 'ai');
    } finally {
        isProcessing = false;
        aiCore.classList.remove('processing');
    }
}

// Text-to-Speech Function
function speakText(text) {
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice =>
        voice.lang.startsWith('en') &&
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
    );

    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    utterance.onstart = function() {
        updateStatus('Speaking... (Click orb to stop)');
    };

    utterance.onend = function() {
        // Only reset status if we aren't immediately listening again
        if (!isProcessing && !isListening) {
            updateStatus('Ready to chat. Click the orb to start.');
        }
    };

    speechSynthesis.speak(utterance);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const speechSupported = initializeSpeechRecognition();

    if (!speechSupported) {
        updateStatus('Speech not supported. Use text input below.');
    }

    aiCore.addEventListener('click', function() {
        // 1. Prevent spam-clicking
        if (isToggleBlocked) return;
        isToggleBlocked = true;
        setTimeout(() => isToggleBlocked = false, 500); // Re-enable click after 500ms

        // 2. Stop speaking immediately
        speechSynthesis.cancel();

        // 3. If processing, don't do anything else
        if (isProcessing) {
            updateStatus('Please wait, still processing...');
            return;
        }

        // 4. Toggle Logic with DELAY
        if (isListening) {
            recognition.stop();
            updateStatus('Stopped listening.');
        } else {
            // SAFETY DELAY: Wait 200ms before starting mic
            // This prevents the 'speechSynthesis.cancel()' from killing the mic
            updateStatus('Initializing mic...');
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (error) {
                    console.error("Mic start error:", error);
                    recognition.stop();
                }
            }, 200);
        }
    });

    sendButton.addEventListener('click', function() {
        const message = textInput.value.trim();
        if (message && !isProcessing) {
            textInput.value = '';
            processTranscript(message);
        }
    });

    textInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            const message = textInput.value.trim();
            if (message && !isProcessing) {
                textInput.value = '';
                processTranscript(message);
            }
        }
    });

    speechSynthesis.onvoiceschanged = function() {
        console.log('Voices loaded');
    };

    setTimeout(() => {
        if (transcriptContent.children.length === 0) {
            addToTranscript("Hello! I'm Hrithik's AI persona. Feel free to ask me about my background, experiences, or anything related to my journey in tech. Click the orb to start talking or use the text input below!", 'ai');
        }
    }, 1000);
});

window.addEventListener('beforeunload', function() {
    if (recognition) recognition.abort();
    speechSynthesis.cancel();
});