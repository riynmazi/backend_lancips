const express = require('express');
const cors = require('cors');
const app = express();
const buyRoute = require('./routes/buy');

app.use(cors());
app.use(express.json());

app.use('/buy', buyRoute);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
