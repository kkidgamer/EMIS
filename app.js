// Entry file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

// middlewares
const app = express();
app.use(express.json());
app.use(cors());

// static files accessibility
app.use('/uploads', express.static('uploads'));

// routes
const loginRoute = require('./routes/loginRoute');
app.use('/api/user', loginRoute);

// connect to the database
mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log('Connected to MongoDB'))
.catch((err) => console.log("MongoDB connection error:", err));

const PORT=3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});