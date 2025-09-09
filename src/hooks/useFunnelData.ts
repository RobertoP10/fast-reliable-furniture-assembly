import { useEffect, useState } from 'react';
import type { FunnelData } from '@/types/funnel';
import { mapFunnelDataToFormData, type MappedFormData } from '@/lib/funnelDataMapper';

export const useFunnelData = () => {
  const [funnelFormData, setFunnelFormData] = useState<Partial<MappedFormData> | null>(null);
  const [hasFunnelData, setHasFunnelData] = useState(false);

  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem('funnelData');
      if (storedData) {
        const funnelData: FunnelData = JSON.parse(storedData);
        
        // Only process if the funnel was completed
        if (funnelData.completed) {
          const mappedData = mapFunnelDataToFormData(funnelData);
          setFunnelFormData(mappedData);
          setHasFunnelData(true);
          
          // Clear the funnel data from sessionStorage after consumption
          sessionStorage.removeItem('funnelData');
        }
      }
    } catch (error) {
      console.error('Error parsing funnel data:', error);
      // Clear invalid data
      sessionStorage.removeItem('funnelData');
    }
  }, []);

  return {
    funnelFormData,
    hasFunnelData
  };
};