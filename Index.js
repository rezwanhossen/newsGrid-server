const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const axios = require("axios");
const { default: axios } = require("axios");

//sk_test_51PQ7GHJBliBBMOOO6OovqSdpedSUaycZFI9sFauPT4rYlb5oK2BdCqGkPkcAlzy6ZCmgG7h8SLoORrGHOvLklWpW00zw9JLyZV
const stripe = require("stripe")(
  "sk_test_51PQ7GHJBliBBMOOO6OovqSdpedSUaycZFI9sFauPT4rYlb5oK2BdCqGkPkcAlzy6ZCmgG7h8SLoORrGHOvLklWpW00zw9JLyZV"
);
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

// Parse incoming JSON and URL-encoded data
// app.use(express.json({ limit: "5mb" }));
// app.use(express.urlencoded({ limit: "5mb", extended: true }));

const uri =
  "mongodb+srv://newsGrid:CfOZMY3YLVMDnpDW@cluster0.p5jkrsj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Store the URI in an env variable

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect(); // Ensure client is connected before making any DB operations

    const bookmarkCollection = client.db("newsGridDB").collection("bookmark");
    const userCollection = client.db("newsGridDB").collection("users");
    const addNewsCollection = client.db("newsGridDB").collection("addNews");
    const paymentcollection = client.db("newsGridDB").collection("payment");
    const allNewsCollection = client.db("newsGridDB").collection("allNews");
    const personalNewsCollection = client
      .db("newsGridDB")
      .collection("personalnewscategoryss");

    //========== rezwan start =======================
    //jwt auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      try {
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "5h",
        });
        res.send({ token });
      } catch (error) {
        res.status(500).send({ message: "Token generation failed" });
      }
    });

    // Middleware for verifying token
    const verifyToken = (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader)
        return res.status(401).send({ message: "Unauthorized access" });

      const token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err)
          return res.status(401).send({ message: "Unauthorized access" });
        req.decoded = decoded;
        next();
      });
    };

    // Middleware for verifying admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const user = await userCollection.findOne({ email });
      if (user?.role !== "admin") {
        return res.status(403).send({ message: "Forbidden access" });
      }
      next();
    };

    // ===================pyment =======================

    app.post("/create-payment-intent", verifyToken, async (req, res) => {
      const price = req.body.price; //paymentIntent { client_secret }
      const amount = parseInt(price) * 100;
      if (!price || amount < 1) return;
      const { client_secret } = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        // payment_method_types: ["card"],
      });
      res.send({ clientSecret: client_secret }); //clientSecret: paymentIntent.clint_secret,
    });
    // payment collection in badge
    app.get("/payment", async (req, res) => {
      const result = await paymentcollection.find().toArray();
      res.send(result);
    });
    app.post("/payment", async (req, res) => {
      const item = req.body;
      const result = await paymentcollection.insertOne(item);
      res.send(result);
    });

    //================users=========================

    // Get all users
    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // Get user by email
    app.get("/useron/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      res.send(user);
    });

    // Check if user is admin
    app.get("/user/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "Unauthorized access" });
      }
      const user = await userCollection.findOne({ email });
      const isAdmin = user?.role === "admin";
      res.send({ admin: isAdmin });
    });

    // Make a user an admin
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role: "admin" } }
      );
      res.send(result);
    });

    // Add a new user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const existingUser = await userCollection.findOne({ email: user?.email });
      if (existingUser) return res.send(existingUser);
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // Delete a user
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const result = await userCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    // ============== rezwan end=========================
    //ashan start========================

    // Bookmark operations
    app.get("/bookmark/:email", async (req, res) => {
      const email = req.params.email;
      const bookmarks = await bookmarkCollection.find({ email }).toArray();
      res.send(bookmarks);
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
      const result = await bookmarkCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });
    //ashan end================================
    // Naimul Islum  Start  ----------------------------

    
    


  
     // user  Category news
      app.get('/myNews/category' , async(req , res) => {
        const category = req.query.category;
        const query = {category : category};
        const news = await addNewsCollection.find(query).toArray();
        // console.log(news , category)
        res.send(news);
      })

          // add news
          app.get('/myNews/:email' , async(req , res) => {
            const email = req.params.email;
            const query ={ email : email};
            const news = await addNewsCollection.find(query).toArray();
            res.send(news);
          })
          app.get('/myNews' , async(req , res) => {
            
            
            const news = await addNewsCollection.find().toArray();
            res.send(news);
          })
          app.delete('/myNews/:id' , async(req , res) => {
            const id = req.params.id;
            const query = { _id : new ObjectId(id)}
            const result = await addNewsCollection.deleteOne(query);
            res.send(result);
          })
          app.patch('/myNews/:status' , async(req , res) => {
            const news = req.body;
            const status = req.params.status;
            const query = {_id : new ObjectId(news?._id)}
            
            const updateDoc ={
              $set : {
                status : status
              }
            }
            const result = await addNewsCollection.updateOne(query , updateDoc);
            res.send(result);
            
          })
         app.post('/addNews' , async(req , res) => {
              const news = req?.body;
              
              const result = await addNewsCollection.insertOne(news);
              
              
              res.send(result);
        })
     //========== rafit rana==========

    // Store or update the selected value category (personalized news category)
    app.post("/storevalue", async (req, res) => {
      const { userEmail, selectedCategory } = req.body;

      try {
        const query = { userEmail: userEmail };


        const updateDoc = {
          $set: {
            selectedCategory: selectedCategory,
            userEmail: userEmail,
          },
        };
        // completed

        const options = { upsert: true };

        const result = await personalNewsCollection.updateOne(
          query,
          updateDoc,
          options
        );

        if (result.upsertedCount > 0) {
          res.send({
            message: "New category added",
            insertedId: result.upsertedId,
          });
        } else {
          res.send({ message: "Category updated successfully" });
        }
      } catch (error) {
        console.log("Error in /storevalue:", error);
        res.status(500).send({ message: "Failed to store or update category" });
      }
    });
    app.get("/getstorevalue/:email", async (req, res) => {
      const userEmail = req.params.email;

      try {
        const result = await personalNewsCollection.findOne({ userEmail });
        if (result) {
          res.send(result);
        } else {
          res.status(404).send({ message: "No data found for this email" });
        }
      } catch (error) {
        console.error("Error retrieving data:", error);
        res
          .status(500)
          .send({ error: "An error occurred while fetching the data" });
      }
    });

          
    

       ======== end rana============
     
    
  } 
  
  finally {
    //await client.close();
  }
}  



// ------------------------------------------
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("newsGrid Server is running..");
});

app.listen(port, () => {
  console.log(`newsGrid is running on port ${port}`);
});
