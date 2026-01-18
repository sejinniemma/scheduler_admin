'use client';

import React from 'react';
import {
  BeatLoader,
  ClipLoader,
  PulseLoader,
  ScaleLoader,
  BarLoader,
  DotLoader,
  HashLoader,
  MoonLoader,
  RingLoader,
  SyncLoader,
} from 'react-spinners';

export type LoaderType =
  | 'beat'
  | 'clip'
  | 'pulse'
  | 'scale'
  | 'bar'
  | 'dot'
  | 'hash'
  | 'moon'
  | 'ring'
  | 'sync';

interface LoadingSpinnerProps {
  type?: LoaderType;
  size?: number | 'sm' | 'md' | 'lg';
  overlay?: boolean;
  color?: string | 'white' | 'blue' | 'default';
  speedMultiplier?: number;
  margin?: number;
  overlayText?: string;
}

const sizeMap = {
  sm: 4,
  md: 6,
  lg: 10,
};

const defaultColorMap = {
  white: '#ffffff',
  blue: '#2563eb',
  default: '#4b5563',
};

const getColorValue = (color: string | 'white' | 'blue' | 'default'): string => {
  if (typeof color === 'string' && color.startsWith('#')) {
    return color;
  }
  return defaultColorMap[color as keyof typeof defaultColorMap] || color;
};

const getSizeValue = (size: number | 'sm' | 'md' | 'lg'): number => {
  if (typeof size === 'number') {
    return size;
  }
  return sizeMap[size];
};

interface LoaderProps {
  size?: number;
  color?: string;
  loading?: boolean;
  speedMultiplier?: number;
  margin?: number;
}

const LoaderComponents: Record<
  LoaderType,
  React.ComponentType<LoaderProps>
> = {
  beat: BeatLoader,
  clip: ClipLoader,
  pulse: PulseLoader,
  scale: ScaleLoader,
  bar: BarLoader,
  dot: DotLoader,
  hash: HashLoader,
  moon: MoonLoader,
  ring: RingLoader,
  sync: SyncLoader,
};

export default function LoadingSpinner({
  type = 'beat',
  size = 'md',
  overlay = false,
  color = 'blue',
  speedMultiplier = 0.8,
  margin = 2,
  overlayText = '처리 중...',
}: LoadingSpinnerProps) {
  const LoaderComponent = LoaderComponents[type];
  const sizeValue = getSizeValue(size);
  const colorValue = getColorValue(color);

  const spinner = (
    <LoaderComponent
      size={sizeValue}
      color={colorValue}
      loading={true}
      speedMultiplier={speedMultiplier}
      margin={margin}
    />
  );

  if (overlay) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm'>
        <div className='flex flex-col items-center gap-[12px]'>
          {spinner}
          {overlayText && (
            <p className='text-body4 text-default'>{overlayText}</p>
          )}
        </div>
      </div>
    );
  }

  return spinner;
}

