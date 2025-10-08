// API configuration
import { API_BASE_URL, buildUrl } from '../config/api';

const API_URL = API_BASE_URL;

// Función helper para hacer requests autenticados
const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expirado o inválido - limpiar localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
  }

  return response;
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
      console.error("Error al obtener modelos:", error);
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
      console.error("Error al entrenar modelo:", error);
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
      console.error("Error al convertir imagen a VHDL:", error);
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
      console.error("Error al extraer pesos del modelo:", error);
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
      console.error("Error al descargar archivo:", error);
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
        throw new Error('No hay token de autenticación');
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
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en la inferencia de FaultInjector:', error);
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
      console.error('Error al configurar inyección de fallos:', error);
      throw error;
    }
  },

  getAvailableLayers: async (modelPath) => {
    try {
      // Esta función podría implementarse en el backend para obtener las capas disponibles
      // Por ahora, retornamos capas típicas de una CNN
      return {
        layers: [
          { name: 'conv2d_1', type: 'convolutional', description: 'Primera capa convolucional' },
          { name: 'maxpooling2d_1', type: 'pooling', description: 'Primera capa de maxpooling' },
          { name: 'conv2d_3', type: 'convolutional', description: 'Segunda capa convolucional' },
          { name: 'maxpooling2d_2', type: 'pooling', description: 'Segunda capa de maxpooling' },
          { name: 'flatten', type: 'flatten', description: 'Capa de aplanamiento' },
          { name: 'dense_6', type: 'dense', description: 'Primera capa densa' },
          { name: 'dense_7', type: 'dense', description: 'Segunda capa densa' },
          { name: 'dense_8', type: 'dense', description: 'Capa de salida' }
        ]
      };
    } catch (error) {
      console.error('Error al obtener capas disponibles:', error);
      throw error;
    }
  }
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
        throw new Error(errorData.detail || 'Error en el login');
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
        throw new Error('Token inválido');
      }

      return await response.json();
    } catch (error) {
      console.error("Error al verificar token:", error);
      throw error;
    }
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
      console.error("Error al obtener modelos para campaña:", error);
      throw error;
    }
  },

  runActivationFaultCampaign: async (campaignConfig) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/fault_campaign/run/`, {
        method: 'POST',
        body: JSON.stringify(campaignConfig),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error ejecutando campaña de fallos en activaciones:", error);
      throw error;
    }
  },

  runWeightFaultCampaign: async (campaignConfig) => {
    try {
      console.log('🚀 Iniciando petición HTTP para campaña de fallos en pesos');
      console.log('📤 URL:', `${API_URL}/fault_campaign/weight/run/`);
      console.log('📤 Config enviada:', JSON.stringify(campaignConfig, null, 2));
      
      const response = await authenticatedFetch(`${API_URL}/fault_campaign/weight/run/`, {
        method: 'POST',
        body: JSON.stringify(campaignConfig),
      });

      console.log('📥 Respuesta HTTP recibida:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error en respuesta HTTP:', errorData);
        throw new Error(errorData.detail || `Error: ${response.status}`);
      }

      const jsonResponse = await response.json();
      console.log('✅ Respuesta JSON recibida:', JSON.stringify(jsonResponse, null, 2));
      return jsonResponse;
    } catch (error) {
      console.error("❌ Error ejecutando campaña de fallos en pesos:", error);
      throw error;
    }
  },
};