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
