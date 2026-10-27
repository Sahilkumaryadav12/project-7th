const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Internal Server Error');

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'A record with this value already exists';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier';
  } else if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file exceeds the 5 MB limit' : 'Invalid uploaded file';
  } else if (err.message && err.message.startsWith('Invalid file type')) {
    statusCode = 422;
    message = err.message;
  } else if (err.message === 'Origin is not allowed by CORS') {
    statusCode = 403;
    message = 'Request origin is not allowed';
  } else if (
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongooseError' ||
    (err.message && (err.message.includes('buffering timed out') || err.message.includes('whitelist') || err.message.includes('SSL')))
  ) {
    statusCode = 503;
    message = 'Database unavailable: In MongoDB Atlas (cloud.mongodb.com), go to Network Access -> Add IP Address -> Allow Access from Anywhere (0.0.0.0/0).';
  }

  if (statusCode >= 500) console.error('[API] Request failed', { method: req.method, path: req.path, error: err.name || 'Error', details: err.message });

  res.status(statusCode).json({
    error: message,
  });
};

module.exports = errorHandler;
