
const express = require("express");
const cors = require('cors')
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, '/build')));
app.use(cors())
app.use(bodyParser.json());


const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017");
    const db = client.db("my-blog");

    await operations(db);

    client.close();
  } catch (error) {
    res.status(500).json({
      message: "Error connecting to the database",
      error: error.stack,
    });
  }
};

app.get("/api/articles/:name", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(articleInfo);
  }, res);
});

app.post("/api/articles/:name/upvote", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    await db
      .collection("articles")
      .updateOne(
        { name: articleName },
        { $set: { upvotes: articleInfo.upvotes + 1 } }
      );

    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.post("/api/articles/:name/add-comment", (req, res) => {
  withDB(async (db) => {
    const { username, text } = req.body;
    const articleName = req.params.name;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          comments: articleInfo.comments.concat({ username, text }),
        },
      }
    );

    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).send(updatedArticleInfo);
  }, res);
});

// app.get("/hello", (req, res) => {
//   res.send("Hello");
// });

// app.get("/hello/:name", (req, res) => {
//   res.send(`Hello ${req.params.name}`);
// });

// app.post("/hello", (req, res) => {
//   res.send(`hello ${req.body.name}!`);
// });

app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname + 'build/index/html'));
})
app.listen(8080, () => console.log("Listening to port 8080"));
