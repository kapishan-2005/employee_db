/**
 * API Response Utility
 * Standardizes API responses across the application
 */

export const successResponse = (res, data, message = null, statusCode = 200) => {
  const response = {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    error: message,
    ...(errors && { errors }),
  };
  return res.status(statusCode).json(response);
};

export const createdResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, message, 201);
};

export const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404);
};

export const validationErrorResponse = (res, errors) => {
  return errorResponse(res, 'Validation failed', 400, errors);
};

export const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return errorResponse(res, message, 401);
};

export const forbiddenResponse = (res, message = 'Forbidden') => {
  return errorResponse(res, message, 403);
};
