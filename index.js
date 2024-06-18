const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
  origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://trip-tailor.web.app'
  ],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions));
app.use(express.json());

// app.use(cors({
//   origin: ['http://localhost:5173','http://localhost:5174', 'https://trip-tailor.web.app'], // Only allow requests from this origin
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Only allow specified HTTP methods
//   allowedHeaders: ['Content-Type'], // Only allow specified headers
// }));


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jakl9vf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const spotCollection = client.db('spotDB').collection('spot');
    const countryCollection = client.db('spotDB').collection('countries');
    
    // load Maximum 6 spots for homepage
    app.get('/spot', async (req, res) => {
      const cursor = spotCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result);
    })

    // load all spots for all spots route
    app.get('/spots', async (req, res) => {
      const cursor = spotCollection.aggregate([
          { $addFields: { cost: { $toInt: "$cost" } } }, // Convert "cost" to integer
          { $sort: { cost: 1 } } // Sort by "cost" in ascending order
      ]);
      const result = await cursor.toArray();
      res.send(result);
  });

    // get spot by user email
    app.get('/lists', async (req, res) => {
      console.log(req.query.email);
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email
        }
      }
      const cursor = spotCollection.find(query).sort({ createdAt: -1 });
      const result = await cursor.toArray();
      res.send(result);
    })

    // get spot by country
    app.get('/spots/countries/:country', async (req, res) => {
      const { country } = req.params;
      try {
        const countryData = await spotCollection.find({ country: country }).toArray();
        res.json(countryData);
      } catch (error) {
        console.error('Error fetching country data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // update/edit spot
    app.put('/spot/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedSpot = req.body;
      const spot = {
        $set: {
          photo: updatedSpot.photo,
          spot_name: updatedSpot.spot_name,
          country: updatedSpot.country,
          location: updatedSpot.location,
          description: updatedSpot.description,
          cost: updatedSpot.cost,
          season: updatedSpot.season,
          time: updatedSpot.time,
          visitors: updatedSpot.visitors,
          email: updatedSpot.email,
          name: updatedSpot.name
        }
      }
      const result = await spotCollection.updateOne(filter, spot, options);
      res.send(result);
    });

    app.get('/spot/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const spot = await spotCollection.findOne(query);
      res.send(spot);
    })


    // load countries data
    app.get('/countries', async (req, res) => {
      const cursor = countryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // add-spot
    app.post('/spot', async (req, res) => {
      const newSpot = req.body;
      console.log(newSpot);
      const result = await spotCollection.insertOne(newSpot);
      res.send(result);
    })

    // delete from my list
    app.delete('/spot/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await spotCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Trip-Tailor server is running')
})

app.listen(port, () => {
  console.log(`Trip-Tailor server is running on port: ${port}`)
})




