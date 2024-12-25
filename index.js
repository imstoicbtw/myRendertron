const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

// Initialize express app
const app = express();

// Enable CORS for all routes
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'OPTIONS'], // Allow only GET and OPTIONS methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow these headers
}));
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
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--deterministic-fetch',
                '--disable-features=IsolateOrigins',
                '--disable-site-isolation-trials'
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
        res.set('Content-Type', 'text/html');
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
        usage: 'GET /render?url=YOUR_FULL_URL'
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at PORT ${port}`);
    console.log('Example usage: /render?url=YOUR_FULL_URL');
});
