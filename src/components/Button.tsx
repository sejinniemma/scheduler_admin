'use client';
import { ReactNode } from 'react';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  leftIcon?: ReactNode;
  showShadow?: boolean;
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
  mt = '30px',
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-[40px] p-[10px] text-body4 font-semibold bg-blue text-white rounded-[10px] transition-all duration-200 flex items-center justify-center gap-[8px] ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:opacity-90'
      } ${showShadow && !disabled ? 'hover:shadow-lg' : ''} ${className}`}
      style={{
        marginTop: mt,
        boxShadow: showShadow ? '0 4px 4px 0 rgba(59, 130, 246, 0.20)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (showShadow) {
          e.currentTarget.style.boxShadow =
            '0 6px 8px 0 rgba(59, 130, 246, 0.30)';
        }
      }}
      onMouseLeave={(e) => {
        if (showShadow) {
          e.currentTarget.style.boxShadow =
            '0 4px 4px 0 rgba(59, 130, 246, 0.20)';
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
