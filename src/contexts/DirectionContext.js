import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '../utils/constants';

const DirectionContext = createContext();

export const useDirection = () => {
  const context = useContext(DirectionContext);
  if (!context) {
    throw new Error('useDirection must be used within a DirectionProvider');
  }
  return context;
};

export const DirectionProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [direction, setDirection] = useState('rtl');

  useEffect(() => {
    const currentDirection = APP_CONFIG.RTL_LANGUAGES.includes(i18n.language) ? 'rtl' : 'ltr';
    setDirection(currentDirection);
    
    // Update document direction
    document.dir = currentDirection;
    
    // Update document language
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const isRTL = direction === 'rtl';
  const isLTR = direction === 'ltr';

  const getTextAlign = (align = 'start') => {
    if (align === 'start') return isRTL ? 'right' : 'left';
    if (align === 'end') return isRTL ? 'left' : 'right';
    return align;
  };

  const getMarginDirection = (side = 'start') => {
    if (side === 'start') return isRTL ? 'marginRight' : 'marginLeft';
    if (side === 'end') return isRTL ? 'marginLeft' : 'marginRight';
    return side;
  };

  const getPaddingDirection = (side = 'start') => {
    if (side === 'start') return isRTL ? 'paddingRight' : 'paddingLeft';
    if (side === 'end') return isRTL ? 'paddingLeft' : 'paddingRight';
    return side;
  };

  const getBorderDirection = (side = 'start') => {
    if (side === 'start') return isRTL ? 'borderRight' : 'borderLeft';
    if (side === 'end') return isRTL ? 'borderLeft' : 'borderRight';
    return side;
  };

  const value = {
    direction,
    isRTL,
    isLTR,
    getTextAlign,
    getMarginDirection,
    getPaddingDirection,
    getBorderDirection
  };

  return (
    <DirectionContext.Provider value={value}>
      {children}
    </DirectionContext.Provider>
  );
};
