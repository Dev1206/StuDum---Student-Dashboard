import React from 'react';
import PropTypes from 'prop-types';

const Card = ({
  variant = 'default',
  padding = 'default',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'bg-white rounded-xl';

  const variants = {
    default: 'border border-secondary-200 shadow-sm',
    elevated: 'shadow-md',
    outlined: 'border border-secondary-200',
    plain: '',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`;

  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'px-6 py-4 border-b border-secondary-200';
  
  return (
    <div className={`${baseStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardContent = ({
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'p-6';
  
  return (
    <div className={`${baseStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'px-6 py-4 border-t border-secondary-200';
  
  return (
    <div className={`${baseStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.propTypes = {
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'plain']),
  padding: PropTypes.oneOf(['none', 'sm', 'default', 'lg']),
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

CardHeader.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

CardContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

CardFooter.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Card; 