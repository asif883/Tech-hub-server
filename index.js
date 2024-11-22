const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middleware 
app.use(cors({
    origin:[ 
      'http://localhost:5173',
      "https://tech-hub-7f6cd.web.app"
    ],
    optionsSuccessStatus: 200
  }))
app.use(express.json())


// token verification 
const verifyJwt =(req, res , next) =>{
    const authorization = req.headers.authorization
    if( !authorization ){
      return res.send({ message: "No token found"})
    }
    const token = authorization.split(' ')[1];

    jwt.verify(token , process.env.ACCESS_TOKEN, (err, decoded) =>{
      if(err){
        return res.send({message : "Invalid token"})
      }
      req.decoded= decoded;
      next()
    })
  }

 // verify Seller

 const verifySeller = async ( req ,res ,next)=>{
    const email = req.decoded.email
    const query = { email : email}
    const user = await userCollection.findOne(query)
    if(user?.role !== 'seller'){
      return res.send({message: "Forbidden access"})
    }
    next()
   }

   
  


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
  const CartCollection = client.db('tech-hub').collection('carts')
  const wishListCollection = client.db('tech-hub').collection('wish-List')


  const dbConnect =async ()=>{
    try{
      // await  client.connect();
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

    // all-user
    app.get('/users' , async ( req, res )=>{
        const result = await userCollection.find().toArray()
        res.send(result)
    })

    // make admin
    app.patch('/users/admin/:id' , async ( req , res) =>{
        const id = req.params.id
        const filter = { _id: new ObjectId(id) }
        const updateDoc = {
            $set: {
                role: "admin"
            }
        }
        const result = await userCollection.updateOne(filter , updateDoc)
        res.send(result)
    })

    // delete 
    app.delete('/users/:id', async(req , res)=>{
        const id = req.params.id;
        const query = {_id : new ObjectId(id)}
        const result =await userCollection.deleteOne(query);
        res.send(result);
      })

     // Add Product
     app.post('/add-products', verifyJwt, verifySeller, async( req, res )=>{
        const product = req.body
        const result = await productCollection.insertOne(product)
        res.send(result)
     }) 

     //  all products
    app.get( '/all-products' , async( req, res )=>{
        const {title, sort, brand, category} = req.query
        const query = {}
  
        if(title){
          query.title ={ $regex:title , $options: 'i'}
        }
        if(category){
          query.category ={ $regex:category , $options: 'i'}
        }
        if(brand){
          query.brand = brand
        }
  
        const sortOptions = sort === 'asc' ? -1 : 1
  
        const products = await productCollection.find(query).sort({price: sortOptions}).toArray()
  
        const productInfo = await productCollection.find({}, { projection:{ category:1 , brand: 1}}).toArray();
  
        const totalProduct = await productCollection.countDocuments(query)
  
        const brands = [...new Set(productInfo.map((product)=> product.brand ))]
        const categories = [...new Set(productInfo.map((product)=> product.category ))]
  
        res.send({products, brands, categories, totalProduct})
      })

    // find product by id
    app.get('/product/:id', async(req , res) =>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const product = await productCollection.findOne(query);
      res.send(product)
  })

  // add to cart 
  app.post('/cart' , async( req , res) =>{
      const cartData = req.body
      const result = await CartCollection.insertOne(cartData)
      res.send(result)
  })
  // add to wishList 
  app.post('/wishList' , async( req , res) =>{
      const listData = req.body
      const result = await wishListCollection.insertOne(listData)
      res.send(result)
  })


  // find cart 
  app.get('/cart/:email' , async (req , res) =>{
    const email= req.params.email
    const query = {buyerEmail: email}
    const result = await CartCollection.find(query).toArray()
    res.send(result)
  })
  // find wish list 
  app.get('/list/:email' , async (req , res) =>{
    const email= req.params.email
    const query = {buyerEmail: email}
    const result = await wishListCollection.find(query).toArray()
    res.send(result)
  })
  // find product by email
  app.get('/my-product/:email', async (req , res) =>{
    const email= req.params.email
    const query = {sellerEmail: email}
    const result = await productCollection.find(query).toArray()
    res.send(result)
  })
  
  // delete product 
  app.delete('/added-product/:id', async(req , res)=>{
    const id = req.params.id;
    const query = {_id : new ObjectId(id)}
    const result = await productCollection.deleteOne(query);
    res.send(result);
  })

   // Update
   app.patch('/updateProduct/:id',async (req, res)=>{
    const id =req.params.id;
    const filter= {_id: new ObjectId(id)};
    const options ={upsert: true};
    const updateProduct = req.body
    const update ={
      $set:{
        title:updateProduct.title,
        brand:updateProduct.brand,
        price:updateProduct.price,
        inStock:updateProduct.inStock, 
        imageURL:updateProduct.imageURL,
        description:updateProduct.description, 
        category:updateProduct.category, 
      }
    }
    const result =await productCollection.updateOne(filter,update,options);
    res.send(result)
  })

        

    }
    catch(err){
        console.log(err.name , err.message);
    }
} 

dbConnect()

// jwt
 
app.post('/authentication', async ( req , res )=>{
    const userEmail = req.body;
    const token = jwt.sign(userEmail , process.env.ACCESS_TOKEN, 
      { expiresIn: '10d'})
      res.send({token})
   })


app.get('/' , async( req , res ) =>{
    res.send('server is running')
})

app.listen(port , ()=>{
    console.log(`server is running on the port :${port}`);
    
})