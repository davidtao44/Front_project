import { useState } from 'react';
import { cnnService } from '../services/api';

export const useCNN = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadModels = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await cnnService.getModels();
      setModels(data.models || []);
      return data;
    } catch (err) {
      setError(err.message || 'Error al cargar los modelos');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const trainModel = async (modelName, trainingConfig) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await cnnService.trainModel({
        model_name: modelName,
        ...trainingConfig
      });
      return data;
    } catch (err) {
      setError(err.message || 'Error al entrenar el modelo');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loadModels,
    trainModel,
    loading,
    error,
    models,
    isLoading
  };
};