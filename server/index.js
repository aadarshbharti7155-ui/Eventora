const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.js');
const eventRoutes = require('./routes/events.js');
const bookingRoutes = require('./routes/bookings.js');


dotenv.config();    

const app = express();
app.use(cors({
    origin: '*', 
    credentials: true
}));

// Simple health check route
app.get('/', (req, res) => {
  res.send('Eventora Backend is up and running!');
});

app.use(express.json());

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

//connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('MongoDB connected');
})
.catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// THIS IS THE CRUCIAL EXACT LINE FOR VERCEL:
module.exports = app;
