require('dotenv').config()
const app = require('./src/app')
const connectDB = require('./src/config/db')
const PORT = process.env.PORT || 3000;

connectDB()

app.listen(3000, () => {
  console.log(`Server running on port ${PORT}`);
});