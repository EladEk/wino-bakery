import React from 'react';
import { useDirection } from '../../contexts/DirectionContext';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  const { isRTL } = useDirection();

  const buttonClasses = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full-width',
    loading && 'btn--loading',
    disabled && 'btn--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      dir={isRTL ? 'rtl' : 'ltr'}
      {...props}
    >
      {loading && <span className="btn__spinner" />}
      <span className={loading ? 'btn__content--loading' : 'btn__content'}>
        {children}
      </span>
    </button>
  );
};

export default Button;
