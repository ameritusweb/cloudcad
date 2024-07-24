import { API_BASE_URL, API_ROUTES, HTTP_METHODS } from '../constants/apiConstants';

class ApiService {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async fetchJson(endpoint, method = HTTP_METHODS.GET, body = null, headers = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: 'include'
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  // API methods

  createModel(modelData) {
    return this.fetchJson(API_ROUTES.CREATE_MODEL, HTTP_METHODS.POST, modelData);
  }

  getModel(modelId) {
    return this.fetchJson(`${API_ROUTES.GET_MODEL}/${modelId}`);
  }

  updateModel(modelId, modelData) {
    return this.fetchJson(`${API_ROUTES.UPDATE_MODEL}/${modelId}`, HTTP_METHODS.PUT, modelData);
  }

  deleteModel(modelId) {
    return this.fetchJson(`${API_ROUTES.DELETE_MODEL}/${modelId}`, HTTP_METHODS.DELETE);
  }

  performCircularCut(modelId, cutData) {
    return this.fetchJson(API_ROUTES.CIRCULAR_CUT, HTTP_METHODS.POST, { modelId, ...cutData });
  }

  performConcentricExtrude(modelId, extrudeData) {
    return this.fetchJson(API_ROUTES.CONCENTRIC_EXTRUDE, HTTP_METHODS.POST, { modelId, ...extrudeData });
  }

  performMirror(modelId, mirrorData) {
    return this.fetchJson(API_ROUTES.MIRROR, HTTP_METHODS.POST, { modelId, ...mirrorData });
  }

  performStructuralAnalysis(modelId, analysisData) {
    return this.fetchJson(API_ROUTES.STRUCTURAL_ANALYSIS, HTTP_METHODS.POST, { modelId, ...analysisData });
  }

  exportModel(modelId) {
    return this.fetchJson(`${API_ROUTES.EXPORT_MODEL}/${modelId}`);
  }

  importModel(modelData) {
    return this.fetchJson(API_ROUTES.IMPORT_MODEL, HTTP_METHODS.POST, modelData);
  }
}

export default new ApiService();