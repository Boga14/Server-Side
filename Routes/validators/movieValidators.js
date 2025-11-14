// Validators and a validation "pipe" for movies routes
// File added: Routes/validators/movieValidators.js
// This file contains request schemas and a `validate(schema, options)` helper
// Options supported: { whitelist: true/false, forbidNonWhitelisted: true/false, transform: true/false }
const { checkSchema, validationResult } = require('express-validator');

// Utility to pick only allowed keys from an object (whitelist)
function pick(obj = {}, keys = []) {
  const out = {};
  keys.forEach(k => {
    if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  });
  return out;
}

// Schemas
const createMovieSchema = {
  title: {
    in: ['body'],
    exists: { errorMessage: 'Titlul este obligatoriu' },
    isString: { errorMessage: 'Titlul trebuie să fie text' },
    isLength: { options: { min: 2, max: 100 }, errorMessage: 'Titlul trebuie să aibă între 2 și 100 caractere' },
    trim: true,
    // custom validator example: no digits allowed in title
    custom: {
      options: value => !/\d/.test(value),
      errorMessage: 'Titlul nu poate conține cifre (exemplu de validare personalizată)'
    }
  },
  year: {
    in: ['body'],
    exists: { errorMessage: 'Anul este obligatoriu' },
    isInt: { options: { min: 1888, max: 2100 }, errorMessage: 'Anul trebuie să fie un număr între 1888 și 2100' },
    toInt: true
  }
};

const updateMovieSchema = {
  title: {
    in: ['body'],
    optional: true,
    isString: { errorMessage: 'Titlul trebuie să fie text' },
    isLength: { options: { min: 2, max: 100 }, errorMessage: 'Titlul trebuie să aibă între 2 și 100 caractere' },
    trim: true
  },
  year: {
    in: ['body'],
    optional: true,
    isInt: { options: { min: 1888, max: 2100 }, errorMessage: 'Anul trebuie să fie un număr între 1888 și 2100' },
    toInt: true
  }
};

const searchByNameSchema = {
  name: {
    in: ['query'],
    exists: { errorMessage: 'Parametrul name este obligatoriu' },
    isString: { errorMessage: 'name trebuie să fie text' },
    isLength: { options: { min: 1 }, errorMessage: 'name trebuie să aibă cel puțin 1 caracter' },
    trim: true
  }
};

const searchByMinYearSchema = {
  minYear: {
    in: ['query'],
    exists: { errorMessage: 'Parametrul minYear este obligatoriu' },
    isInt: { options: { min: 1800, max: 2100 }, errorMessage: 'minYear trebuie să fie un număr valid' },
    toInt: true
  }
};

// validate(schema, options) returns an array of middlewares to run for express
function validate(schema, options = { whitelist: true, forbidNonWhitelisted: false, transform: true }) {
  const allowedKeys = Object.keys(schema).map(field => field);

  // build validators via checkSchema
  const validators = checkSchema(schema);

  // post-processing middleware: handle validationResult + apply whitelist/forbid/transform
  const after = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // transform: (we used toInt in schema) express-validator already transformed.
    if (options.whitelist) {
      // For body, keep only allowed keys
      if (req.body && typeof req.body === 'object') {
        req.body = pick(req.body, allowedKeys);
      }
      // For query, keep only allowed keys
      if (req.query && typeof req.query === 'object') {
        req.query = pick(req.query, allowedKeys);
      }
    }

    if (options.forbidNonWhitelisted) {
      // detect any keys not whitelisted in body or query
      const badBodyKeys = req.body ? Object.keys(req.body).filter(k => !allowedKeys.includes(k)) : [];
      const badQueryKeys = req.query ? Object.keys(req.query).filter(k => !allowedKeys.includes(k)) : [];
      if (badBodyKeys.length || badQueryKeys.length) {
        return res.status(400).json({ error: 'Request conține câmpuri nepermise', details: { body: badBodyKeys, query: badQueryKeys } });
      }
    }

    next();
  };

  return Array.isArray(validators) ? [...validators, after] : [validators, after];
}

module.exports = {
  createMovieSchema,
  updateMovieSchema,
  searchByNameSchema,
  searchByMinYearSchema,
  validate
};
