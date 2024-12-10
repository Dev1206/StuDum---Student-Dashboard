import React from 'react';
import PropTypes from 'prop-types';

const Container = ({
  size = 'default',
  padding = true,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'mx-auto';

  const sizes = {
    sm: 'max-w-3xl',
    default: 'max-w-7xl',
    lg: 'max-w-[1400px]',
    xl: 'max-w-[1600px]',
    full: 'max-w-full',
  };

  const paddings = padding ? 'px-4 sm:px-6 lg:px-8' : '';

  const combinedClassName = `${baseStyles} ${sizes[size]} ${paddings} ${className}`;

  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  );
};

Container.propTypes = {
  size: PropTypes.oneOf(['sm', 'default', 'lg', 'xl', 'full']),
  padding: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Container; 