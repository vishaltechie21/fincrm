require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./db/connection');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Ensure MySQL connection is active before booting
  await testConnection();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
