// Servicio para manejar las llamadas a la API
const API_URL = "http://127.0.0.1:8000";

export const cnnService = {
  createCNN: async (config) => {
    try {
      const response = await fetch(`${API_URL}/create_cnn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error al crear CNN:", error);
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
      
      const response = await fetch(`${API_URL}/convert_image_to_vhdl/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
  }
};