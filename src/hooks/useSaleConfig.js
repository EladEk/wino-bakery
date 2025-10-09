import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { saleConfigService } from '../services/saleConfig';

export const useSaleConfig = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState({
    saleDate: '',
    startHour: '',
    endHour: '',
    address: '',
    bitNumber: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = saleConfigService.subscribe((configData) => {
      if (configData) {
        setConfig({
          saleDate: configData.value || '',
          startHour: configData.startHour || '',
          endHour: configData.endHour || '',
          address: configData.address || '',
          bitNumber: configData.bitNumber || ''
        });
      }
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  const updateConfig = async (newConfig) => {
    try {
      setError(null);
      return await saleConfigService.update(newConfig);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getHebrewDay = (dateString) => {
    const daysHebrew = [t("sunday"), t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday")];
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return daysHebrew[date.getDay()];
  };

  const saleDateDay = config.saleDate ? getHebrewDay(config.saleDate) : '';

  return {
    config,
    loading,
    error,
    updateConfig,
    saleDateDay,
    getHebrewDay
  };
};
