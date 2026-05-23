// API configuration
import { API_BASE_URL, buildUrl } from '../config/api';

const API_URL = API_BASE_URL;

// Función helper para hacer requests autenticados
const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No authentication token');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  // Configurar timeout (por defecto 30 segundos, configurable)
  const timeoutMs = options.timeout || 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      // Token expirado o inválido - limpiar localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('La solicitud ha excedido el tiempo límite');
    }
    throw error;
  }
};

export const cnnService = {
  getModels: async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/models`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching models:", error);
      throw error;
    }
  },

  trainModel: async (config) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/train_model`, {
        method: "POST",
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error training model:", error);
      throw error;
    }
  },
  
  // Nuevo método para convertir imágenes a VHDL
  convertImageToVHDL: async (imageData, options = {}) => {
    try {
      const payload = {
        image_data: imageData,
        output_format: options.outputFormat || "hex",
        width: options.width || 32,
        height: options.height || 32
      };
      
      const response = await authenticatedFetch(`${API_URL}/convert_image_to_vhdl/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error converting image to VHDL:", error);
      throw error;
    }
  },
  
  // Nuevo método para extraer pesos y sesgos del modelo
  exportModelWeights: async (modelPath, bitsValue = 8) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/extract_model_weights/`, {
        method: "POST",
        body: JSON.stringify({
          model_path: modelPath,
          output_dir: "model_weights",
          bits_value: bitsValue
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error extracting model weights:", error);
      throw error;
    }
  },
  
  // Método para descargar un archivo generado
  downloadFile: async (filePath) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/download_file/?file_path=${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Devolver el contenido del archivo como texto
      const content = await response.text();
      return { content };
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
  }
};

// Servicio para FaultInjector
export const faultInjectorService = {
  performInference: async (imageFile, modelPath, faultConfig = null) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('model_path', modelPath);
      
      if (faultConfig) {
        formData.append('fault_config', JSON.stringify(faultConfig));
      }

      const response = await fetch(`${API_URL}/fault_injector/inference/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in FaultInjector inference:', error);
      throw error;
    }
  },

  configureFaultInjection: async (faultConfig) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/fault_injector/configure/`, {
        method: 'POST',
        body: JSON.stringify(faultConfig),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error configuring fault injection:', error);
      throw error;
    }
  },

  // Obtiene las capas reales del modelo desde el backend (cualquier CNN).
  getAvailableLayers: async (modelPath) => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/models/layers/?model_path=${encodeURIComponent(modelPath)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error: ${response.status}`);
      }

      const data = await response.json();
      return {
        ...data,
        layers: (data.layers || []).map((layer) => ({
          ...layer,
          description: layer.output_shape
            ? `${layer.type} ${JSON.stringify(layer.output_shape)}`
            : layer.type,
        })),
      };
    } catch (error) {
      console.error('Error fetching available layers:', error);
      throw error;
    }
  }
};

// Servicio para el módulo de construcción y entrenamiento de CNN
export const trainingService = {
  // Helper interno para GET autenticados que devuelven JSON
  _get: async (path) => {
    const response = await authenticatedFetch(`${API_URL}${path}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error: ${response.status}`);
    }
    return response.json();
  },

  // Helper interno para POST autenticados que devuelven JSON
  _post: async (path, body) => {
    const response = await authenticatedFetch(`${API_URL}${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
      timeout: 60000,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error: ${response.status}`);
    }
    return response.json();
  },

  getDatasets: () => trainingService._get('/datasets/'),

  getDatasetPreview: (name, n = 8) =>
    trainingService._get(`/datasets/${encodeURIComponent(name)}/preview?n=${n}`),

  getLayerTypes: () => trainingService._get('/cnn/layer-types/'),

  getTemplates: () => trainingService._get('/cnn/templates/'),

  getTemplate: (name, dataset) =>
    trainingService._get(
      `/cnn/template/${encodeURIComponent(name)}?dataset=${encodeURIComponent(dataset)}`
    ),

  buildModel: (spec) => trainingService._post('/cnn/build/', spec),

  startTraining: (request) => trainingService._post('/training/start/', request),

  getTrainingStatus: (jobId) =>
    trainingService._get(`/training/status/${encodeURIComponent(jobId)}`),

  getTrainingResult: (jobId) =>
    trainingService._get(`/training/result/${encodeURIComponent(jobId)}`),
};

// Servicios de autenticación (opcional - ya están en AuthContext)
export const authService = {
  login: async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error in login');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  verifyToken: async (token) => {
    try {
      const response = await fetch(`${API_URL}/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid token');
      }

      return await response.json();
    } catch (error) {
      console.error("Error verifying token:", error);
      throw error;
    }
  },
};

export const hlsService = {
  quantize: async (modelName, totalBits = 16, intBits = 6) => {
    const response = await authenticatedFetch(`${API_URL}/hls/quantize/`, {
      method: 'POST',
      body: JSON.stringify({ model_name: modelName, total_bits: totalBits, int_bits: intBits }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || `Error ${response.status}`);
    return data;
  },

  convert: async (config) => {
    const response = await authenticatedFetch(`${API_URL}/hls/convert/`, {
      method: 'POST',
      body: JSON.stringify(config),
      timeout: 120000,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || `Error ${response.status}`);
    return data;
  },

  downloadProject: async (sessionId) => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_URL}/hls/download/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.blob();
  },
};

export const faultCampaignService = {
  getAvailableModels: async () => {
    try {
      const response = await authenticatedFetch(`${API_URL}/fault_campaign/models/`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching models for campaign:", error);
      throw error;
    }
  },

  runActivationFaultCampaign: async (campaignConfig) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/fault_campaign/run/`, {
        method: 'POST',
        body: JSON.stringify(campaignConfig),
        timeout: 600000, // 10 minutos para campañas de fallos largas
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error running activation fault campaign:", error);
      throw error;
    }
  },

  runWeightFaultCampaign: async (campaignConfig) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/fault_campaign/weight/run/`, {
        method: 'POST',
        body: JSON.stringify(campaignConfig),
        timeout: 600000,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("❌ Error ejecutando campaña de fallos en pesos:", error);
      throw error;
    }
  },

  // ── Async job API ─────────────────────────────────────────────────────────
  startWeightFaultCampaign: async (campaignConfig) => {
    const response = await authenticatedFetch(`${API_URL}/fault_campaign/weight/start/`, {
      method: 'POST',
      body: JSON.stringify(campaignConfig),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error: ${response.status}`);
    }
    return await response.json(); // { job_id, status }
  },

  getCampaignJobStatus: async (jobId) => {
    const response = await authenticatedFetch(`${API_URL}/fault_campaign/status/${jobId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error: ${response.status}`);
    }
    return await response.json(); // { job_id, status, progress, phase, error }
  },

  getCampaignJobResults: async (jobId) => {
    const response = await authenticatedFetch(`${API_URL}/fault_campaign/results/${jobId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error: ${response.status}`);
    }
    return await response.json();
  },

  // ── SAI (Stuck-at Asymmetry Index) ────────────────────────────────────────
  runSAI: async (saiConfig) => {
    const response = await authenticatedFetch(`${API_URL}/fault_campaign/sai/run/`, {
      method: 'POST',
      body: JSON.stringify(saiConfig),
      timeout: 600000,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error: ${response.status}`);
    }
    return await response.json();
  },

  startSAI: async (saiConfig) => {
    const response = await authenticatedFetch(`${API_URL}/fault_campaign/sai/start/`, {
      method: 'POST',
      body: JSON.stringify(saiConfig),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error: ${response.status}`);
    }
    return await response.json();
  },

  getSAIStatus: async (jobId) => {
    const response = await authenticatedFetch(`${API_URL}/fault_campaign/status/${jobId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error: ${response.status}`);
    }
    return await response.json();
  },

  getSAIResults: async (jobId) => {
    const response = await authenticatedFetch(`${API_URL}/fault_campaign/results/${jobId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error: ${response.status}`);
    }
    return await response.json();
  },

  getSAIHeatmap: async () => {
    const response = await authenticatedFetch(`${API_URL}/fault_campaign/sai/heatmap/`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error: ${response.status}`);
    }
    return await response.json();
  },
};