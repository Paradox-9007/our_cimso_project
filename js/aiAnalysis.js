import { generateAiContent } from '../js/apiCaller.js';

const analysisCache = new Map();

// Format the analysis text with proper styling
function formatAnalysis(analysis) {
    return analysis
        .replace(/##\s*(.*?)(?:\n|$)/g, (match, p1) => {
            const cleanHeader = p1.replace(/\s*\([^)]*\)/g, '');
            return `<h5 style="text-align: center">${cleanHeader}</h5>`;
        })
        .replace(/\*\*(.*?)\*\*/g, '<br><b>$1</b>')
        .replace(/\s\*(?!\*)/g, ' ')
        .replace(/\*(?!\*)/g, ' ')
        .replace(/\n/g, '<br>')
        .replace(/<br><br>/g, '<br>')
        .replace(/([-]?\d+\.?\d*%)/g, '<b>$1</b>');
}

// Create timeout promise
function createTimeout(ms) {
    return new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), ms)
    );
}

// Main function to generate and display AI analysis
export async function generateAnalysis(elementId, data) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const maxRetries = 3;
    let retryCount = 0;

    // Create cache key from data
    const cacheKey = JSON.stringify(data);

    while (retryCount < maxRetries) {
        try {
            // Show loading state
            element.innerHTML = 'Generating analysis...';

            // Check cache first
            if (analysisCache.has(cacheKey)) {
                element.innerHTML = analysisCache.get(cacheKey);
                return;
            }

            // Generate analysis
            const analysis = await Promise.race([
                generateAiContent(data),
                createTimeout(30000)
            ]);

            const formattedAnalysis = formatAnalysis(analysis);
            const finalHtml = `<div id="ai-text">${formattedAnalysis}</div>`;
            
            // Cache the result
            analysisCache.set(cacheKey, finalHtml);
            element.innerHTML = finalHtml;
            return;

        } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            retryCount++;

            if (retryCount === maxRetries) {
                element.innerHTML = 'Unable to generate AI analysis. Please try again later.';
            } else {
                await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            }
        }
    }
}