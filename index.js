const express = require('express');
const puppeteer = require('puppeteer');

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

/**
 * GET endpoint to fetch and render a webpage
 * @param {string} url - The URL to fetch and render (passed as query parameter)
 * @returns {string} - The rendered HTML content
 */
app.get('/render', async (req, res) => {
    try {
        // Get the URL from query parameters
        const urlToRender = req.query.url;
        
        // Validate URL parameter
        if (!urlToRender) {
            return res.status(400).json({ 
                error: 'URL parameter is required' 
            });
        }

        // Launch browser instance with specific args for cloud deployment
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process'
            ]
        });

        // Create a new page
        const page = await browser.newPage();

        // Navigate to the URL and wait for network to be idle
        await page.goto(urlToRender, {
            waitUntil: 'networkidle0' // Wait until network is idle (no requests for 500ms)
        });

        // Get the rendered HTML content
        const renderedContent = await page.content();

        // Close browser
        await browser.close();

        // Send the rendered content as response
        res.send(renderedContent);

    } catch (error) {
        console.error('Error rendering page:', error);
        res.status(500).json({ 
            error: 'Failed to render page',
            details: error.message 
        });
    }
});

// Add a simple health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'Server is running',
        usage: 'GET /render?url=https://example.com'
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Example usage: http://localhost:3000/render?url=https://example.com');
});
