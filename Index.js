const express = require("express");
const app = express();
var jwt = require("jsonwebtoken");
require("dotenv").config();
const cors = require("cors");

const port = process.env.PORT || 5000;
const API_KEY = process.env.API_KEY;
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://newsgrid-95245.web.app",
    ],
  })
);
app.use(express.json());

//======================================
//CfOZMY3YLVMDnpDW

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { default: axios } = require("axios");

const uri =
  "mongodb+srv://newsGrid:CfOZMY3YLVMDnpDW@cluster0.p5jkrsj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const bookmarkCollection = client.db("newsGridDB").collection("bookmark");
    const userCollection = client.db("newsGridDB").collection("users");

    
    //jwt auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res.send({ token });
    });

    // Verify Token Middleware
    const verifyToken = async (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    //veryfy admin
    const veryfiAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbennen akcess" });
      }
      next();
    };

    // Naimul Islum -------------------------
    const fetchNews = (url, res) => {
      axios
        .get(url)
        .then((response) => {
          if (response.data.totalResults > 0) {
            res.json({
              status: 200,
              success: true,
              message: "Successfully fetched the data",
              data: response.data,
            });
          } else {
            res.json({
              status: 200,
              success: true,
              message: "No more results to show",
            });
          }
        })
        .catch((error) => {
          res.json({
            status: 500,
            success: false,
            message: "Failed to fetch data from the api",
            error: error.message,
          });
        });
    };

    // all News and category
    app.get("/all-news", (req, res) => {
      let pageSize = parseInt(req.query.pageSize) || 100;
      let page = parseInt(req.query.page) || 1;

      const url = `https://newsapi.org/v2/everything?q=page=${page}&pageSize=${pageSize}&apiKey=${API_KEY}`;
      fetchNews(url, res);
    });

    //top-headlines : category
    app.get("/top-headlines", (req, res) => {
      let pageSize = parseInt(req.query.pageSize) || 95;
      let page = parseInt(req.query.page) || 1;
      let category = req.query.category || "business";
      console.log("category", category);

      let url = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&page=${page}&pageSize${pageSize}&apiKey=${API_KEY}`;
      fetchNews(url, res);
    });
    // app.get('/country',(req , res) => {
    //   let pageSize = parseInt(req.query.pageSize) || 80;
    //   let page = parseInt(req.query.page) || 1;
    //   let country = req.params.iso || 'af';
    //   let url = `https://newsapi.org/v2/top-headlines?country=${country}&page=${page}&pageSize${pageSize}&apiKey=${API_KEY}`;
    //   fetchNews(url  , res)
    // })

    // ---------------------------------------
    //user collection related

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/useron/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usercol.findOne(query);
      res.send(result);
    });

    app.get("/user/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "unauthorize" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      const isExist = await userCollection.findOne(query);
      if (isExist) return res.send(isExist);
      const result = await userCollection.insertOne(user);

      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    //bookmark
    app.get("/bookmark/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await bookmarkCollection.find(query).toArray();
      res.send(result);
    });

    // Add a bookmark
    app.post("/bookmarks", async (req, res) => {
      const newBookmark = req.body;
      const result = await bookmarkCollection.insertOne(newBookmark);
      res.send(result);
    });

    // Delete a bookmark
    app.delete("/bookmarks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookmarkCollection.deleteOne(query);
      res.send(result);
    });
    // Send a ping to confirm a successful connection

    // await client.db("admin").command({ ping: 1 });
  } finally {
    //await client.close();
  }
}
run().catch(console.dir);

//==============================================================================
app.get("/", (req, res) => {
  res.send("newsGrid  Server..");
});

app.listen(port, () => {
  console.log(`newsGrid was running ${port}`);
});
