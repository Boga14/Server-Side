
const { parse } = require('csv-parse/sync');

function csvFileValidator(options = {}) {
  const maxSize = options.maxSize || 2 * 1024 * 1024; 
  const expectedHeaders = options.expectedHeaders || ['title', 'year']; 

  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Fișier lipsă. Trimiteți un fișier CSV sub câmpul "file".' });
    }

    const file = req.file;

    if (!file.originalname || !file.originalname.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({ error: 'Fișierul trebuie să aibă extensia .csv' });
    }

    if (file.mimetype && !file.mimetype.includes('csv') && !file.mimetype.includes('text')) {
      return res.status(400).json({ error: `Tip MIME neacceptat: ${file.mimetype}. Așteptat text/csv` });
    }

    if (file.size > maxSize) {
      return res.status(400).json({ error: `Fișier prea mare. Maxim ${maxSize} bytes` });
    }

    try {
      const content = file.buffer.toString('utf8');
      const records = parse(content, { bom: true, to_line: 1 });
      const headerRow = records[0].map(h => String(h).trim().toLowerCase());

      const missing = expectedHeaders.filter(h => !headerRow.includes(h.toLowerCase()));
      if (missing.length) {
        return res.status(400).json({ error: 'Header-ele CSV nu corespund DTO-ului', missing });
      }

      req.csvHeader = headerRow;
      next();
    } catch (err) {
      return res.status(400).json({ error: 'Eroare la parsarea fișierului CSV', details: err.message });
    }
  };
}

function parseCsvBufferToObjects(buffer, header) {
  const content = buffer.toString('utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  return records;
}

module.exports = {
  csvFileValidator,
  parseCsvBufferToObjects
};
