
const { checkSchema, validationResult } = require('express-validator');

function pick(obj = {}, keys = []) {
  const out = {};
  keys.forEach(k => {
    if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  });
  return out;
}

const createMovieSchema = {
  title: {
    in: ['body'],
    exists: { errorMessage: 'Titlul este obligatoriu' },
    isString: { errorMessage: 'Titlul trebuie să fie text' },
    isLength: { options: { min: 2, max: 100 }, errorMessage: 'Titlul trebuie să aibă între 2 și 100 caractere' },
    trim: true,

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

function validate(schema, options = { whitelist: true, forbidNonWhitelisted: false, transform: true }) {
  const allowedKeys = Object.keys(schema).map(field => field);

  const validators = checkSchema(schema);

  const after = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (options.whitelist) {
      if (req.body && typeof req.body === 'object') {
        req.body = pick(req.body, allowedKeys);
      }
      if (req.query && typeof req.query === 'object') {
        req.query = pick(req.query, allowedKeys);
      }
    }

    if (options.forbidNonWhitelisted) {  
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
