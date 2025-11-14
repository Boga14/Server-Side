const express = require('express');
const app = express();
app.use(express.json());
const port = 3000;


const movieRoutes = require('./Routes/movies');
app.use('/movies', movieRoutes);

app.get('/', (req, res) => {
  res.send('Aplicația funcționează!');
});

app.listen(port, () => {
  console.log(`Serverul rulează pe http://localhost:${port}`);
});