'use client';
import { ReactNode } from 'react';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  leftIcon?: ReactNode;
  showShadow?: boolean;
  customShadow?: string;
  mt?: string;
  disabled?: boolean;
}

export default function Button({
  text,
  onClick,
  type = 'button',
  className = '',
  leftIcon,
  showShadow = true,
  customShadow,
  mt = '30px',
  disabled = false,
}: ButtonProps) {
  const defaultShadow = '0 4px 4px 0 rgba(59, 130, 246, 0.20)';
  const hoverShadow = '0 6px 8px 0 rgba(59, 130, 246, 0.30)';
  const shadowValue = customShadow || (showShadow ? defaultShadow : 'none');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-[40px] p-[10px] text-body4 font-semibold bg-blue text-white rounded-[10px] transition-all duration-200 flex items-center justify-center gap-[8px] ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:opacity-90'
      } ${
        showShadow && !disabled && !customShadow ? 'hover:shadow-lg' : ''
      } ${className}`}
      style={{
        marginTop: mt,
        boxShadow: shadowValue,
      }}
      onMouseEnter={(e) => {
        if (showShadow && !customShadow) {
          e.currentTarget.style.boxShadow = hoverShadow;
        } else if (customShadow) {
          e.currentTarget.style.boxShadow = customShadow;
        }
      }}
      onMouseLeave={(e) => {
        if (customShadow) {
          e.currentTarget.style.boxShadow = customShadow;
        } else if (showShadow) {
          e.currentTarget.style.boxShadow = defaultShadow;
        } else {
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {leftIcon && <span>{leftIcon}</span>}
      {text}
    </button>
  );
}
