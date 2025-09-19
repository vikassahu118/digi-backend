require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');

const PORT = process.env.PORT || 3000;

connectDB();

app.listen(PORT, '0.0.0.0',() => {
  console.log(`Server is running on port ${PORT}`);
});