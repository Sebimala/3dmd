
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Safely access API_KEY to prevent runtime errors if 'process' or 'process.env' are undefined.
let API_KEY: string | undefined;
try {
    if (typeof process !== 'undefined' && process.env) {
        API_KEY = process.env.API_KEY;
    }
} catch (e) {
    console.warn("Could not access process.env.API_KEY. Ensure it's set if running in Node, or properly injected during build for browsers.", e);
    API_KEY = undefined;
}


if (!API_KEY) {
    console.error("API_KEY environment variable not set or `process.env` is not accessible in this environment. The application will not be able to connect to the AI service.");
    const errorDiv = document.getElementById('error-message') as HTMLDivElement;
    if (errorDiv) {
        errorDiv.textContent = "Configuration error: API Key is not available. Please ensure the API_KEY environment variable is set during the build/deployment process for the application to function.";
        errorDiv.style.display = 'block';
    }
    // Disable search functionality
    const searchButton = document.getElementById('search-button') as HTMLButtonElement;
     if (searchButton) {
        searchButton.disabled = true;
    }
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    if (searchInput) {
        searchInput.disabled = true;
    }
}

// Initialize AI client. It's okay to pass undefined apiKey if API_KEY is not set;
// subsequent checks will prevent API calls.
const ai = new GoogleGenAI({ apiKey: API_KEY });

const searchInput = document.getElementById('search-input') as HTMLInputElement;
const searchButton = document.getElementById('search-button') as HTMLButtonElement;
const loadingIndicator = document.getElementById('loading-indicator') as HTMLDivElement;
const errorMessageDiv = document.getElementById('error-message') as HTMLDivElement;
const resultContainer = document.getElementById('result-container') as HTMLDivElement;
const resultContent = document.getElementById('result-content') as HTMLParagraphElement;

// Attach event listener only if searchButton exists to prevent errors during initial setup if API key is missing
if (searchButton) {
    searchButton.addEventListener('click', async () => {
        const query = searchInput.value.trim();

        if (!query) {
            displayError("Please enter a search query.");
            return;
        }

        if (!API_KEY) {
            displayError("API Key is not configured. Cannot perform search. Please ensure API_KEY is set in the deployment environment.");
            searchButton.disabled = true; // Ensure it remains disabled
            return;
        }

        showLoading(true);
        clearResults();

        try {
            const prompt = `You are a creative assistant. Based on the following user query, describe in detail the first 3D model that comes to mind. 
Focus on its visual characteristics like shape, materials, textures, colors, and any unique features or overall artistic style.
User query: "${query}"`;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17',
                contents: prompt,
            });
            
            const description = response.text;

            if (description) {
                displayResult(description);
            } else {
                displayError("The AI didn't return a description. Please try a different query.");
            }

        } catch (error) {
            console.error("Error generating 3D model description:", error);
            let userFriendlyError = "An error occurred while generating the description. Please try again.";
            if (error instanceof Error) {
                if (error.message.includes('API key not valid')) {
                    userFriendlyError = "The provided API Key is invalid. Please check your configuration.";
                } else if (error.message.includes('quota')) {
                     userFriendlyError = "You have exceeded your API quota. Please try again later.";
                } else if (error.message.toLowerCase().includes('api key service forbidden')) {
                    userFriendlyError = "API Key is not valid or missing permissions for the Gemini API. Please check your Google Cloud project and API key settings."
                }
            }
            displayError(userFriendlyError);
        } finally {
            showLoading(false);
        }
    });
}

// Attach event listener only if searchInput exists
if (searchInput) {
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            // Trigger click only if searchButton exists and is enabled
            if (searchButton && !searchButton.disabled) {
                searchButton.click();
            }
        }
    });
}


function showLoading(isLoading: boolean): void {
    if (loadingIndicator) { // Check if element exists
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
    if (searchButton) { // Check if element exists
        searchButton.disabled = isLoading;
    }
    if (searchInput) { // Check if element exists
        searchInput.disabled = isLoading;
    }
}

function displayError(message: string): void {
    if (errorMessageDiv) { // Check if element exists
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }
    if (resultContainer) { // Check if element exists
        resultContainer.style.display = 'none';
    }
}

function displayResult(description: string): void {
    if (resultContent) { // Check if element exists
        resultContent.textContent = description;
    }
    if (resultContainer) { // Check if element exists
        resultContainer.style.display = 'block';
    }
    if (errorMessageDiv) { // Check if element exists
        errorMessageDiv.style.display = 'none';
    }
}

function clearResults(): void {
    if (errorMessageDiv) { // Check if element exists
        errorMessageDiv.style.display = 'none';
    }
    if (resultContainer) { // Check if element exists
        resultContainer.style.display = 'none';
    }
    if (resultContent) { // Check if element exists
        resultContent.textContent = '';
    }
}

// Initial check for API_KEY already disables searchInput if key is missing and searchInput exists.
// Redundant explicit disabling of searchInput here if already handled by the top block,
// but ensures it if the top block's searchInput check was missed or structure changes.
if (!API_KEY && searchInput) {
    searchInput.disabled = true;
}
