require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {MongoClient} = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);
const db = client.db('Cluster0');
const urls = db.collection('urls');
const dns = require('dns');
const urlparser = require('url');
const url = require("node:url");
const app = express();


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function (req, res) {
    console.log(req.body);
    const url = req.body.url;
    const dnsLookup = dns.lookup(urlparser.parse(url).hostname, async (err, address) => {
        if (!address) {
            res.json({error: 'Invalid URL'});
        } else {
            const urlCount = await urls.countDocuments();
            const urlDoc = {
                url: url,
                short_url: urlCount
            }
            const result = await urls.insertOne(urlDoc);
            console.log(result)
            res.json({original_url: url, short_url: urlCount})
        }
    });
});


app.get('/api/shorturl/:short_url', async (req, res) => {
    try {
        const shorturl = req.params.short_url;
        const urlDoc = await urls.findOne({short_url: +shorturl});

        if (!urlDoc) {
            return res.status(404).json({error: 'No short URL found'});
        }

        res.redirect(urlDoc.url);
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});