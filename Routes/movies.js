const express = require('express');
const router = express.Router();

const { createMovieSchema, updateMovieSchema, searchByNameSchema, searchByMinYearSchema, validate } = require('./validators/movieValidators');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); 
const { csvFileValidator, parseCsvBufferToObjects } = require('./csvPipe');

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

// Pipe LAB2
function uppercaseName(req, res, next) {
  if (req.query && req.query.name) {
    req.query.name = String(req.query.name).toUpperCase();
  }
  if (req.body && req.body.title) {
    req.body.title = String(req.body.title).toUpperCase();
  }
  next();
}

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

router.get('/search', validate(searchByMinYearSchema, { whitelist: true, forbidNonWhitelisted: false, transform: true }), (req, res) => {
  const { minYear } = req.query; 

  const filtered = movies.filter(movie => movie.year >= parseInt(minYear));

  if (filtered.length === 0) {
    return res.status(404).json({ error: 'Niciun film nu a fost găsit după anul specificat' });
  }

  res.json(filtered);
});


router.post('/add', validate(createMovieSchema, { whitelist: true, forbidNonWhitelisted: true, transform: true }), (req, res) => {

  const { title, year } = req.body;

  const newMovie = {
    id: movies.length + 1,
    title,
    year: parseInt(year)
  };

  movies.push(newMovie);
  res.status(201).json(newMovie);
});

// Endpoint LAB2
router.get('/search/name', validate(searchByNameSchema, { whitelist: true, forbidNonWhitelisted: true, transform: true }), uppercaseName, (req, res) => {
  const name = req.query.name; 

  const filtered = movies.filter(m => String(m.title).toUpperCase().includes(name));

  if (filtered.length === 0) {
    return res.status(404).json({ error: 'Niciun film nu a fost găsit după numele specificat' });
  }

  res.json(filtered);
});

router.post('/import', upload.single('file'), csvFileValidator({ expectedHeaders: ['title', 'year'], maxSize: 2 * 1024 * 1024 }), (req, res) => {
  const rows = parseCsvBufferToObjects(req.file.buffer, req.csvHeader);

  const result = { totalRows: rows.length, successful: 0, failed: 0, errors: [], imported: [] };

  rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const data = {
      title: row.title ? String(row.title).trim() : '',
      year: row.year ? String(row.year).trim() : ''
    };

    const rowErrors = [];
    if (!data.title) rowErrors.push('Titlul este obligatoriu');
    else if (data.title.length < 2 || data.title.length > 100) rowErrors.push('Titlul trebuie să aibă între 2 și 100 caractere');
    else if (/\d/.test(data.title)) rowErrors.push('Titlul nu poate conține cifre');

    if (!data.year) rowErrors.push('Anul este obligatoriu');
    else if (!/^\d+$/.test(data.year)) rowErrors.push('Anul trebuie să fie un număr întreg');
    else {
      const y = parseInt(data.year, 10);
      if (y < 1888 || y > 2100) rowErrors.push('Anul trebuie să fie între 1888 și 2100');
    }

    if (rowErrors.length) {
      result.failed += 1;
      result.errors.push({ row: rowNum, data: row, errors: rowErrors });
    } else {
      const movie = { id: movies.length + 1, title: data.title, year: parseInt(data.year, 10) };
      movies.push(movie);
      result.successful += 1;
      result.imported.push(movie);
    }
  });

  res.json(result);
});

router.get('/export', (req, res) => {
  let outputMovies = movies.slice();

  if (req.query.name) {
    const name = String(req.query.name).toUpperCase();
    outputMovies = outputMovies.filter(m => String(m.title).toUpperCase().includes(name));
  }
  if (req.query.minYear) {
    const minY = parseInt(req.query.minYear, 10);
    if (!isNaN(minY)) outputMovies = outputMovies.filter(m => m.year >= minY);
  }

  const header = ['id', 'title', 'year'];
  const csvLines = [header.join(',')];
  outputMovies.forEach(m => {
    const safeTitle = (`"${String(m.title).replace(/"/g, '""')}"`);
    csvLines.push([m.id, safeTitle, m.year].join(','));
  });

  const csvContent = csvLines.join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="movies_export.csv"');
  res.send(csvContent);
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = movies.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Filmul nu a fost găsit' });
  }

  const deleted = movies.splice(index, 1)[0];
  res.json({ message: 'Filmul a fost șters', film: deleted });
});

router.put('/:id', validate(updateMovieSchema, { whitelist: true, forbidNonWhitelisted: true, transform: true }), (req, res) => {
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