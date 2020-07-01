import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';
import { withDB } from './withDB';

const app = express();

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '/build')))

app.get('/api/articles/:name', async (req, res) => {
    const { name } = req.params;
    const results = await withDB(async db => {
        return await db.collection('articles').findOne({ name });
    });
    res.status(200).json(results);
});

app.post('/api/articles/:name/upvote', async (req, res) => {
    const { name } = req.params;
    try {
        const client = await MongoClient.connect(
            'mongodb://localhost:27017',
            { useNewUrlParser: true, useUnifiedTopology: true },
        );
        const db = client.db('react-blog-db-3');

        const articleInfo = await db.collection('articles').findOne({ name });
        await db.collection('articles').updateOne({ name }, {
            '$set': { upvotes: articleInfo.upvotes + 1 }
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name });

        res.status(200).json(updatedArticleInfo);

        client.close();
    } catch (err) {
        res.status(500).send({ message: 'Database Error', err });
    }
});

app.post('/api/articles/:name/add-comment', async (req, res) => {
    const { name } = req.params;
    const { postedBy, text } = req.body;

    try {
        const client = await MongoClient.connect(
            'mongodb://localhost:27017',
            { useNewUrlParser: true, useUnifiedTopology: true },
        );
        const db = client.db('react-blog-db-3');

        const articleInfo = await db.collection('articles').findOne({ name });
        await db.collection('articles').updateOne({ name }, {
            '$set': { comments: articleInfo.comments.concat({ postedBy, text }) }
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name });

        res.status(200).json(updatedArticleInfo);

        client.close();
    } catch (err) {
        res.status(500).send({ message: 'Database Error', err });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/build/index.html'))
});

app.listen(8000, () => console.log('Server is listening on port 8000'));