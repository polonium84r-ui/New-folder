import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for offline functionality and data synchronization
 * Handles offline storage and sync when connection is restored
 */
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState([]);
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored! Syncing data...');
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost. Working offline...');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending operations from localStorage
    loadPendingOperations();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingOperations = useCallback(() => {
    try {
      const stored = localStorage.getItem('pendingOperations');
      if (stored) {
        setPendingOperations(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  }, []);

  const savePendingOperations = useCallback((operations) => {
    try {
      localStorage.setItem('pendingOperations', JSON.stringify(operations));
    } catch (error) {
      console.error('Failed to save pending operations:', error);
    }
  }, []);

  const addPendingOperation = useCallback((operation) => {
    const newOperation = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...operation
    };

    setPendingOperations(prev => {
      const updated = [...prev, newOperation];
      savePendingOperations(updated);
      return updated;
    });

    toast.info('Operation saved for sync when online');
    return newOperation.id;
  }, [savePendingOperations]);

  const removePendingOperation = useCallback((operationId) => {
    setPendingOperations(prev => {
      const updated = prev.filter(op => op.id !== operationId);
      savePendingOperations(updated);
      return updated;
    });
  }, [savePendingOperations]);

  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || pendingOperations.length === 0 || syncInProgress) {
      return;
    }

    setSyncInProgress(true);

    try {
      const results = [];
      
      for (const operation of pendingOperations) {
        try {
          let result;
          
          switch (operation.type) {
            case 'CREATE_PATIENT':
              result = await syncCreatePatient(operation.data);
              break;
            case 'UPDATE_PATIENT':
              result = await syncUpdatePatient(operation.data);
              break;
            case 'UPLOAD_ANALYSIS':
              result = await syncUploadAnalysis(operation.data);
              break;
            default:
              console.warn('Unknown operation type:', operation.type);
              continue;
          }

          results.push({ operation, result, success: true });
          removePendingOperation(operation.id);
          
        } catch (error) {
          console.error('Failed to sync operation:', operation, error);
          results.push({ operation, error, success: false });
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (successful > 0) {
        toast.success(`Synced ${successful} operations successfully`);
      }
      
      if (failed > 0) {
        toast.error(`Failed to sync ${failed} operations`);
      }

    } catch (error) {
      console.error('Sync process failed:', error);
      toast.error('Sync failed. Will retry later.');
    } finally {
      setSyncInProgress(false);
    }
  }, [isOnline, pendingOperations, syncInProgress, removePendingOperation]);

  // Sync helper functions
  const syncCreatePatient = async (patientData) => {
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(patientData)
    });

    if (!response.ok) {
      throw new Error('Failed to create patient');
    }

    return response.json();
  };

  const syncUpdatePatient = async (updateData) => {
    const response = await fetch(`/api/patients/${updateData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(updateData.data)
    });

    if (!response.ok) {
      throw new Error('Failed to update patient');
    }

    return response.json();
  };

  const syncUploadAnalysis = async (analysisData) => {
    const formData = new FormData();
    formData.append('image', analysisData.image);
    formData.append('patientId', analysisData.patientId);

    const response = await fetch('/api/analysis/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload analysis');
    }

    return response.json();
  };

  // Cache management
  const cacheData = useCallback((key, data, ttl = 3600000) => { // 1 hour default TTL
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }, []);

  const getCachedData = useCallback((key) => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      const now = Date.now();

      if (now - cacheItem.timestamp > cacheItem.ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }, []);

  const clearCache = useCallback((pattern) => {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => 
        key.startsWith('cache_') && 
        (pattern ? key.includes(pattern) : true)
      );
      
      cacheKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, []);

  return {
    isOnline,
    pendingOperations,
    syncInProgress,
    addPendingOperation,
    removePendingOperation,
    syncPendingOperations,
    cacheData,
    getCachedData,
    clearCache
  };
};