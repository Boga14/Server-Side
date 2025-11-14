// CSV file validation and parsing middleware
// File added: Routes/csvPipe.js
// Purpose: Validate uploaded CSV files (existence, extension, MIME type, size limit, headers)
// and provide a helper to parse CSV content into rows.
const { parse } = require('csv-parse/sync');

// Validate CSV file middleware factory
function csvFileValidator(options = {}) {
  const maxSize = options.maxSize || 2 * 1024 * 1024; // default 2MB
  const expectedHeaders = options.expectedHeaders || ['title', 'year']; // default expected headers

  return (req, res, next) => {
    // ADDED: check that multer attached file is present
    if (!req.file) {
      return res.status(400).json({ error: 'Fișier lipsă. Trimiteți un fișier CSV sub câmpul "file".' });
    }

    const file = req.file;

    // Check extension
    if (!file.originalname || !file.originalname.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({ error: 'Fișierul trebuie să aibă extensia .csv' });
    }

    // Check mime type (basic check)
    if (file.mimetype && !file.mimetype.includes('csv') && !file.mimetype.includes('text')) {
      return res.status(400).json({ error: `Tip MIME neacceptat: ${file.mimetype}. Așteptat text/csv` });
    }

    // Check size
    if (file.size > maxSize) {
      return res.status(400).json({ error: `Fișier prea mare. Maxim ${maxSize} bytes` });
    }

    // Parse header row to validate columns
    try {
      // ADDED: use csv-parse/sync to parse only the header (first line)
      const content = file.buffer.toString('utf8');
      const records = parse(content, { bom: true, to_line: 1 });
      const headerRow = records[0].map(h => String(h).trim().toLowerCase());

      // Check headers length and exact match of expectedHeaders (order-insensitive)
      const missing = expectedHeaders.filter(h => !headerRow.includes(h.toLowerCase()));
      if (missing.length) {
        return res.status(400).json({ error: 'Header-ele CSV nu corespund DTO-ului', missing });
      }

      // Attach parsed header to request for later use
      req.csvHeader = headerRow;
      next();
    } catch (err) {
      return res.status(400).json({ error: 'Eroare la parsarea fișierului CSV', details: err.message });
    }
  };
}

// Helper: parse entire CSV buffer into array of objects using header
function parseCsvBufferToObjects(buffer, header) {
  const content = buffer.toString('utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  // records is array of objects where keys are header names
  return records;
}

module.exports = {
  csvFileValidator,
  parseCsvBufferToObjects
};
