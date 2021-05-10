const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const Validator = require('jsonschema').Validator;
const jsonschema = new Validator();

const FLAG_URL = process.env.FLAG_URL || 'https://scrape.sdc.tf/flags';

let browser;
puppeteer.launch().then((b) => { browser = b });

// fetches the list of flags to check for from the flag server
async function loadFlags(page, authkey) {
    // first we set our auth cookie
    // by using httpOnly, we make it so the cookie can't be read by client javascript! take that!
    await page.setCookie({ name: 'flag_access', value: authkey, domain: 'scrape.sdc.tf', httpOnly: true });
    // fetch the flag endpoint now that we're authenticated
    const response = await page.goto(FLAG_URL);
    // parse the json response and return the flag array
    return await response.json();
}

// verify the body is in the correct format
function isValidBody(body) {
    return jsonschema.validate(body, { type: 'object', properties: { url: { type: 'string', required: true } }, required: true });
}

// verify a string is a valid, visitable URL
function isURL(string) {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch(_) {
        return false;
    }
}

async function scanForFlag(page, flags, url) {
    // visit the requested URL
    await page.goto(url);

    // get a string containing the source code of the website
    const content = await page.content();

    // check for any flags
    for (const flag of flags) {
        if(content.includes(flag)) {
            return 'flag detected';
        }
    }

    return 'flag not detected';
}

module.exports.getScrapeBackend = function(authkey) {
    const router = express.Router();
    router.use(bodyParser.urlencoded({ extended: false }));

    // serve the static frontend
    router.get('/', (req, res) => {
        res.sendFile(__dirname + '/scrapeFrontend.html');
    });

    // serve the flag scanning endpoint
    router.post("/scrape", async (req, res) => {

        const context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();

        // we don't have any flags, so we'll have to fetch them from the super secret flag store
        const flags = await loadFlags(page, authkey);

        // verify the request matches expectations and were we given a url?
        if(!isValidBody(req.body) || !isURL(req.body.url)) {
            res.status(400).send('malformed request');
            return;
        }

        try {
            const result = await scanForFlag(page, flags, req.body.url);
            res.status(200).send(result);
        } catch(_) {
            res.status(500).send("Couldn't scan webpage");
        }
    });

    return router;
}
