const express = require('express');
const router = express.Router();

const movies = [
  { id: 1, title: "Inception", year: 2010 },
  { id: 2, title: "Interstellar", year: 2014 },
  { id: 3, title: "The Matrix", year: 1999 },
  { id: 4, title: "Fight Club", year: 1999 },
  { id: 5, title: "Pulp Fiction", year: 1994 },
  { id: 6, title: "The Godfather", year: 1972 },
  { id: 7, title: "The Dark Knight", year: 2008 },
  { id: 8, title: "Forrest Gump", year: 1994 },
  { id: 9, title: "Gladiator", year: 2000 },
  { id: 10, title: "Titanic", year: 1997 }
];

router.get('/list', (req, res) => {
  let output = '';
  movies.forEach(movie => {
    output += `Film: ${movie.title}, lansat în ${movie.year}\n`;
  });
  res.type('text/plain');
  res.send(output);
});

router.get('/details/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const movie = movies.find(m => m.id === id);

  if (!movie) {
    return res.status(404).json({ error: 'Filmul nu a fost găsit' });
  }

  res.json(movie);
});

router.get('/search', (req, res) => {
  const { minYear } = req.query;

  if (!minYear) {
    return res.status(400).json({ error: 'Te rog să specifici un parametru minYear' });
  }

  const filtered = movies.filter(movie => movie.year >= parseInt(minYear));

  if (filtered.length === 0) {
    return res.status(404).json({ error: 'Niciun film nu a fost găsit după anul specificat' });
  }

  res.json(filtered);
});

router.post('/add', (req, res) => {
  const { title, year } = req.body;

  if (!title || !year) {
    return res.status(400).json({ error: 'Titlul și anul sunt obligatorii' });
  }

  const newMovie = {
    id: movies.length + 1,
    title,
    year: parseInt(year)
  };

  movies.push(newMovie);
  res.status(201).json(newMovie);
});

module.exports = router;

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = movies.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Filmul nu a fost găsit' });
  }

  const deleted = movies.splice(index, 1)[0];
  res.json({ message: 'Filmul a fost șters', film: deleted });
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, year } = req.body;
  const movie = movies.find(m => m.id === id);

  if (!movie) {
    return res.status(404).json({ error: 'Filmul nu a fost găsit' });
  }
  if (!title && !year) {
    return res.status(400).json({ error: 'Cel puțin un câmp (title sau year) trebuie trimis' });
  }

  if (title) movie.title = title;
  if (year)  movie.year = parseInt(year);

  res.json({ message: 'Filmul a fost actualizat', film: movie });
});
module.exports = router;
