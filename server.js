require("dotenv").config();
const express = require ("express");
const cors= require("cors");
const path= require("path");
const connectDB = require("./config/db");

const authRoutes= require('./routes/authRoutes')
const userRoutes= require('./routes/userRoutes')
const taskRoutes= require('./routes/taskRoutes')
const reportRoutes = require('./routes/reportRoutes')

const app= express();

app.get("/",(req,res)=>{
    res.send("welcome to the API")
})


//middleware to handle CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET","POST","PUT","DELETE"],
        allowedHeaders:["Content-Type","Authorization"],
    })
);

//Connect Database
connectDB()


//Middleware
app.use(express.json());


//Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);


//Serve uploads folder
app.use("/uploads",express.static(path.join(__dirname,"uploads")));

//Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));

