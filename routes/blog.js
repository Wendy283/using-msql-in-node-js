const express = require('express');

const db = require('../data/database');

const router = express.Router();

router.get('/', function(req, res) {
    res.redirect('/posts');
});

router.get('/posts', async function(req, res) {
    const query = `
     SELECT posts.*, authors.name AS author_name FROM posts
     INNER JOIN authors ON posts.author_id = authors.id
     `;
     const [posts] = await db.query(query)
    res.render('posts-list', {posts: posts });
});

router.get('/new-post', async function(req, res){
    const [authors] = await db.query('SELECT * FROM authors');
    res.render('create-post', { authors: authors });
});

router.post('/posts', async function (req, res) {
    const data = [
        req.body.title,
        req.body.summary,
        req.body.content,
        req.body.author,
    ]; 
    await db.query('INSERT INTO posts (title, summary, body, author_id) VALUES (?)', [
        data,
    ]);
    res.redirect('/posts');
});

router.get('/posts/:id', async function(req, res) {
    const query = `
    SELECT posts.*, authors.name AS author_name, authors.email AS author_email FROM posts
    INNER JOIN authors ON posts.author_id = authors.id
    WHERE posts.id = ?
    `;

    const [posts] = await db.query(query, [req.params.id]);

    if (!posts || posts.lenght === 0) {
        return res.status(404).render('404');
    }

    const postData = {
        ...posts[0],
        date: posts[0].date.toISOString(),
        humanReadableDate: posts[0].date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day:'numeric',
        }),
    };
    res.render('post-detail', {post: postData });
});

router.get('/posts/:id/edit', async function(req, res) {
    const query = `SELECT * FROM posts WHERE id = ?`;
    const [posts] = await db.query(query, [req.params.id]);

    if (!posts || posts.length === 0) {
        return res.status(404).render('404');
    }

    // DEBUG: Look at your terminal/command prompt to see the exact keys
    console.log(posts[0]); 

    res.render('update-post', { post: posts[0] });
});

// 1. Added the leading slash /
router.post('/posts/:id/edit', async function (req, res) {
    const query = `
        UPDATE posts 
        SET title = ?, summary = ?, body = ?
        WHERE id = ?
    `;

    
    console.log('Form Data Received:', req.body);
    console.log('Post ID:', req.params.id);

    try {
        await db.query(query, [
            req.body.title,
            req.body.summary,
            req.body.content, 
            req.params.id,
        ]);

        res.redirect('/posts');
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).send('Failed to update post');
    }
});

router.post('/posts/:id/delete', async function(req, res) {
    await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.redirect('/posts');
});

module.exports = router;