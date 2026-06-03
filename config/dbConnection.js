const mongoose = require('mongoose');

const dbConnection = ()=>{
    mongoose.connect(process.env.DB_URI).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit the process with an error code
}); 
}

module.exports = dbConnection;