import { type FC, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface ContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Container: FC<ContainerProps> = ({
  children,
  className,
  maxWidth = 'lg',
  padding = 'md',
}) => {
  const maxWidthStyles = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  const paddingStyles = {
    none: 'px-0',
    sm: 'px-4',
    md: 'px-4 md:px-6',
    lg: 'px-4 md:px-8 lg:px-12',
  };

  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidthStyles[maxWidth],
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
};

export default Container;