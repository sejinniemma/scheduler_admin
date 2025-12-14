import React from 'react';
import { cn } from '../lib/utiles';

const PCLayout = ({
  children,
  id,
  className,
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) => {
  return (
    <section
      id={id}
      className={cn(
        'flex justify-center items-center max-w-[1440px] h-screen bg-light  mx-auto w-full',
        className
      )}
    >
      {children}
    </section>
  );
};

export default PCLayout;
