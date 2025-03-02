// Nuevo componente para renderizar iconos
import { IconType } from 'react-icons';
import React from 'react';
import { IconBaseProps } from 'react-icons/lib';

interface IconRendererProps {
  Icon: IconType;
  size?: number;
  className?: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ Icon, size = 20, className = '' }) => {
  const IconComponent = Icon as React.ComponentType<IconBaseProps>;
  return <IconComponent size={size} className={className} />;
}; 