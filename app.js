import { GoogleGenerativeAI } from '@google/generative-ai';

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const apiKeyModal = document.getElementById('api-key-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const clearKeyBtn = document.getElementById('clear-key-btn');
    const chatForm = document.getElementById('chat-form');
    const promptInput = document.getElementById('prompt-input');
    const chatHistory = document.getElementById('chat-history');
    const typingIndicator = document.getElementById('typing-indicator');

    // State
    let genAI = null;
    let chatSession = null;
    let apiKey = localStorage.getItem('maroon_gemini_api_key');

    // Initialize
    if (apiKey) {
        initGemini(apiKey);
    } else {
        apiKeyModal.classList.remove('hidden');
    }

    // Auto-resize textarea
    promptInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if(this.value === '') this.style.height = 'auto';
    });

    // Handle Enter to submit (Shift+Enter for new line)
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    // Save API Key
    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('maroon_gemini_api_key', key);
            apiKeyModal.classList.add('hidden');
            initGemini(key);
        }
    });

    // Clear API Key
    clearKeyBtn.addEventListener('click', () => {
        localStorage.removeItem('maroon_gemini_api_key');
        location.reload();
    });

    // Simple Markdown Parser for code blocks & bold
    function parseMarkdown(text) {
        let html = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    // Append Message to UI
    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message', 'glass-message');
        
        const content = document.createElement('div');
        content.innerHTML = parseMarkdown(text);
        
        msgDiv.appendChild(content);
        chatHistory.appendChild(msgDiv);
        
        // Scroll to bottom
        chatHistory.parentElement.scrollTop = chatHistory.parentElement.scrollHeight;
    }

    // Initialize Gemini Chat
    function initGemini(key) {
        try {
            genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            chatSession = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: "Act as an expert AI assistant named Maroon GPT." }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "I am ready. I am Maroon GPT, powered by Gemini 1.5 Flash." }],
                    },
                ]
            });
        } catch(e) {
            console.error("Failed to initialize AI:", e);
            alert("Invalid API configuration. Please clear key and try again.");
        }
    }

    // Handle Form Submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = promptInput.value.trim();
        
        if (!prompt || !chatSession) return;
        
        // UI Updates
        promptInput.value = '';
        promptInput.style.height = 'auto';
        appendMessage(prompt, 'user');
        
        typingIndicator.classList.remove('hidden');
        chatForm.querySelector('button').disabled = true;

        try {
            const result = await chatSession.sendMessage(prompt);
            const response = result.response.text();
            
            typingIndicator.classList.add('hidden');
            appendMessage(response, 'bot');
            
        } catch(error) {
            console.error(error);
            typingIndicator.classList.add('hidden');
            appendMessage("⚠️ Error: Failed to connect to Gemini API. Check your API key.", 'bot');
        } finally {
            chatForm.querySelector('button').disabled = false;
            promptInput.focus();
        }
    });
});
