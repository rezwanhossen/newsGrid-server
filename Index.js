const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

//======================================
//CfOZMY3YLVMDnpDW

const { MongoClient, ServerApiVersion } = require("mongodb");
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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

const db = client.db("newsGridDB");
const interactionsCollection = db.collection("interactions");

// API to update views for an article
app.post("/update-view", async (req, res) => {
  const { articleUrl } = req.body;
  try {
    const result = await interactionsCollection.findOneAndUpdate(
      { articleUrl },
      { $inc: { views: 1 } },
      { upsert: true, returnOriginal: false } // Ensures the latest document is returned
    );
    if (!result.value) {
      console.log('View update failed, no result returned');
    }
    res.send(result.value);
  } catch (error) {
    console.error("Error updating view", error);
    res.status(500).send("Failed to update views");
  }
});


// API to update likes for an article
app.post("/update-like", async (req, res) => {
  const { articleUrl } = req.body;
  try {
    const result = await interactionsCollection.findOneAndUpdate(
      { articleUrl },
      { $inc: { likes: 1 } },
      { upsert: true, returnOriginal: false }
    );
    if (!result.value) {
      console.log('Like update failed, no result returned');
    }
    res.send(result.value);
  } catch (error) {
    console.error("Error updating like", error);
    res.status(500).send("Failed to update likes");
  }
});


// API to get interaction data (likes and views)
app.get("/interactions", async (req, res) => {
  try {
    const interactions = await interactionsCollection.find({}).toArray();
    res.send(interactions);
  } catch (error) {
    console.error("Error fetching interaction data", error);
    res.status(500).send("Failed to fetch interaction data");
  }
});

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
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



