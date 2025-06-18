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
        isListening = true;
        aiCore.classList.add('listening');
        updateStatus('Listening... Speak now.');
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        console.log('Recognized:', transcript);
        
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
        isListening = false;
        aiCore.classList.remove('listening');
        
        let errorMessage = 'Speech recognition error. ';
        switch(event.error) {
            case 'network':
                errorMessage += 'Check your internet connection.';
                break;
            case 'not-allowed':
                errorMessage += 'Microphone access denied.';
                break;
            case 'no-speech':
                errorMessage += 'No speech detected.';
                break;
            default:
                errorMessage += 'Try again or use text input.';
        }
        updateStatus(errorMessage);
    };

    recognition.onend = function() {
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
        updateStatus('Speaking... Click the orb when ready to continue.');

    } catch (error) {
        console.error('Error processing request:', error);
        updateStatus('Error: Unable to process request. Check connection.');
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
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
    );
    
    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    utterance.onstart = function() {
        updateStatus('Speaking...');
    };

    utterance.onend = function() {
        updateStatus('Ready to chat. Click the orb to start.');
    };

    utterance.onerror = function(event) {
        console.error('Speech synthesis error:', event);
        updateStatus('Speech error, but response is in transcript.');
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
        if (isProcessing) {
            updateStatus('Please wait, still processing...');
            return;
        }

        if (isListening) {
            recognition.stop();
            updateStatus('Stopped listening.');
        } else {
            if (recognition) {
                try {
                    recognition.start();
                } catch (error) {
                    console.error('Error starting recognition:', error);
                    updateStatus('Error starting speech recognition. Try text input.');
                }
            } else {
                updateStatus('Speech recognition not available. Use text input.');
            }
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
        console.log('Voices loaded:', speechSynthesis.getVoices().length);
    };

    setTimeout(() => {
        if (transcriptContent.children.length === 0) {
            addToTranscript("Hello! I'm Hrithik's AI persona. Feel free to ask me about my background, experiences, or anything related to my journey in tech. Click the orb to start talking or use the text input below!", 'ai');
        }
    }, 1000);
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        speechSynthesis.pause();
    } else {
        speechSynthesis.resume();
    }
});

window.addEventListener('beforeunload', function() {
    if (recognition && isListening) {
        recognition.stop();
    }
    speechSynthesis.cancel();
});