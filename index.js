const express = require('express');
const cors = require('cors');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion } = require('mongodb');


// middleware 
app.use(cors())
app.use(express.json())


// mongoDB

const uri= `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.osztyuf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });


  const userCollection = client.db('tech-hub').collection('users')
  const productCollection = client.db('tech-hub').collection('products')


  const dbConnect =async ()=>{
    try{
      await  client.connect();
      console.log('DB connected')

   // insert Users
      app.post('/user', async( req, res )=>{
        const user = req.body;
        const query = { email : user.email}
        const existingUser = await userCollection.findOne(query)
        if(existingUser){
            return res.send({message :'User already exists'})
        }
        const result = await userCollection.insertOne(user);
        res.send(result)
       })
        
    // get user
      app.get('/user/:email' , async ( req, res )=>{
      const query = {email: req.params.email}
      const user = await userCollection.findOne(query)
      res.send(user)   
    })
        

    }
    catch(err){
        console.log(err.name , err.message);
    }
} 

dbConnect()


app.get('/' , async( req , res ) =>{
    res.send('server is running')
})

app.listen(port , ()=>{
    console.log(`server is running on the port :${port}`);
    
})