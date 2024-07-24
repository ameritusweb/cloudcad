// API base URL
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// API routes
export const API_ROUTES = {
  CREATE_MODEL: '/api/create_new_model',
  GET_MODEL: '/api/get_model',
  UPDATE_MODEL: '/api/update_model',
  DELETE_MODEL: '/api/delete_model',
  CIRCULAR_CUT: '/api/circular_cut',
  CONCENTRIC_EXTRUDE: '/api/concentric_extrude',
  MIRROR: '/api/mirror',
  STRUCTURAL_ANALYSIS: '/api/structural_analysis/analyze',
  EXPORT_MODEL: '/api/export_model',
  IMPORT_MODEL: '/api/import_model',
};

// HTTP methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};