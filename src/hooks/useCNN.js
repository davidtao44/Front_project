import { useState } from 'react';
import { cnnService } from '../services/api';

export const useCNN = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const createCNN = async (config) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await cnnService.createCNN(config);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message || 'Error al crear el modelo CNN');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCNN,
    loading,
    error,
    result
  };
};