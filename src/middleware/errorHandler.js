/**
 * Centralized Error Handler Middleware
 * Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
 * Project: TerraCraft Artisanal Ceramics
 */

function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // PostgreSQL unique violation error code: 23505
  if (err.code === '23505' || (err.message && err.message.includes('unique constraint'))) {
    let detailMsg = 'A record with this unique identifier already exists.';
    if (err.detail) {
      detailMsg = err.detail;
    } else if (err.message) {
      if (err.message.includes('slug')) detailMsg = 'A record with this slug already exists.';
      if (err.message.includes('sku_code')) detailMsg = 'A SKU with this code already exists.';
    }
    return res.status(409).json({
      success: false,
      error: 'ConflictDuplicateResource',
      message: detailMsg
    });
  }

  // PostgreSQL foreign key violation error code: 23503
  if (err.code === '23503' || (err.message && err.message.includes('foreign key constraint'))) {
    return res.status(400).json({
      success: false,
      error: 'ForeignKeyViolation',
      message: err.detail || 'Referenced relational record does not exist or cannot be removed due to foreign key restrictions.'
    });
  }

  // PostgreSQL check constraint violation error code: 23514
  if (err.code === '23514' || (err.message && err.message.includes('check constraint'))) {
    return res.status(400).json({
      success: false,
      error: 'CheckConstraintViolation',
      message: 'Database check constraint failed: numeric values (price, stock quantity) cannot be negative.'
    });
  }

  // Explicit status on error object
  const statusCode = err.status || err.statusCode || 500;
  const response = {
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected server error occurred.'
  };

  if (err.details) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
