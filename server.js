const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

/*add caching and delays */

const app = express();





const PORT = process.env.PORT || 5000;

app.listen(process.env.PORT || PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



app.use(cors());




const BASE_URL = 'https://mlp.fandom.com';


app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MLP Wiki Scraper</title>
      <style>
        body { font-family: sans-serif; max-width: 20em; margin: auto; padding: 2em; }
        h1 { color: #6a0dad; }
        a { color: #9b59b6; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>MLP Wiki Scraper API</h1>
      <p>Endpoints:</p>
      <ul>
        <li><a href="/api/character/Twilight_Sparkle">/api/character/Twilight_Sparkle</a></li>
        <li><a href="/api/search?q=apple">/api/search?q=apple</a></li>
      </ul>
    </body>
    </html>
  `);
});

app.get(['/api/character/:name', '/pony/character/:name', '/mlp/char/:name'], async (req, res) => {
    const { name } = req.params;

    if (!name) {

        console.warn('no character.');
        return res.status(400).json({ error: 'Character name missing.' });
    }

    const wikiPageUrl = `${BASE_URL}/wiki/${encodeURIComponent(name)}`;

    try {
        const response = await axios.get(wikiPageUrl);
        const $ = cheerio.load(response.data);

        const character = {
            name: $('h1.page-header__title').text().trim() || 'Unknown',
            image: $('figure.pi-item.pi-image img').attr('src') || null,
            species: $('div[data-source="species"] .pi-data-value').text().trim() || 'Unknown',
            gender: $('div[data-source="gender"] .pi-data-value').text().trim() || 'Unknown',
            occupation: $('div[data-source="occupation"] .pi-data-value').text().trim() || 'Unknown',
            relatives: $('div[data-source="relatives"] .pi-data-value').text().trim() || 'None',
            firstAppearance: $('div[data-source="first appearance"] .pi-data-value').text().trim() || 'N/A',
            summary: $('div.mw-parser-output p').first().text().trim() || 'No summary available.',
            wikiUrl: wikiPageUrl
        };

        if (character.name === 'Unknown') {
            console.info(`"${name}" not found.`);

            return res.status(404).json({ error: 'character has not been found.' });
        }

        res.json(character);

    } catch (error) {
        console.error('eerrorr char', error.message);

        res.status(500).json({ error: 'failed to fetch the character info. please try again' });
    }
});



app.get(['/api/search', '/pony/search', '/mlp/find'], async (req, res) => {

    const { q } = req.query;

    if (!q) {
        console.warn('missing search query');
        return res.status(400).json({ error: 'missing search query.' });
    }

    const searchUrl = `${BASE_URL}/wiki/Special:Search?query=${encodeURIComponent(q)}`;


    try {
        const response = await axios.get(searchUrl);

        const $ = cheerio.load(response.data);

        const results = [];

        $('li.unified-search__result').each((_, el) => {
            const title = $(el).find('a.unified-search__result__title').text().trim();
            const link = $(el).find('a.unified-search__result__title').attr('href');
            const snippet = $(el).find('div.unified-search__result__snippet').text().trim();


            if (title && link) {
                results.push({
                    title,
                    url: BASE_URL + link,
                    snippet
                });
            }


        });

        if (results.length === 0) {
            console.info(`nooo osearch results: "${q}".`);
        }

        res.json(results);
    } catch (error) {
        console.error('error when searching: ', error.message);
        res.status(500).json({ error: 'the search has failed. try again' });
    }
});

app.listen(PORT, () => {
    console.log(`the server is running at ${PORT}`);
});