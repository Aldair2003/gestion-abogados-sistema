import React from 'react';
import { IconType } from 'react-icons';

interface IconWrapperProps {
  icon: IconType;
  className?: string;
  'aria-hidden'?: boolean | string;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ icon: Icon, ...props }) => {
  const Component = Icon as React.ElementType;
  return <Component {...props} />;
}; 