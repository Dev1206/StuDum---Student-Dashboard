import React from 'react';
import PropTypes from 'prop-types';

const baseStyles = {
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-semibold tracking-tight',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-semibold',
  h5: 'text-lg font-medium',
  h6: 'text-base font-medium',
  subtitle1: 'text-lg font-normal',
  subtitle2: 'text-base font-medium',
  body1: 'text-base font-normal',
  body2: 'text-sm font-normal',
  caption: 'text-sm font-normal text-secondary-600',
  overline: 'text-xs font-medium uppercase tracking-wider',
};

const colorStyles = {
  primary: 'text-secondary-900',
  secondary: 'text-secondary-600',
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-600',
};

const Typography = ({
  variant = 'body1',
  color = 'primary',
  component,
  className = '',
  children,
  ...props
}) => {
  const Component = component || {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    subtitle1: 'p',
    subtitle2: 'p',
    body1: 'p',
    body2: 'p',
    caption: 'span',
    overline: 'span',
  }[variant];

  const combinedClassName = `${baseStyles[variant]} ${colorStyles[color]} ${className}`;

  return (
    <Component className={combinedClassName} {...props}>
      {children}
    </Component>
  );
};

Typography.propTypes = {
  variant: PropTypes.oneOf([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'subtitle1', 'subtitle2',
    'body1', 'body2',
    'caption', 'overline'
  ]),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'error']),
  component: PropTypes.elementType,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

// Pre-configured variants
export const H1 = (props) => <Typography variant="h1" {...props} />;
export const H2 = (props) => <Typography variant="h2" {...props} />;
export const H3 = (props) => <Typography variant="h3" {...props} />;
export const H4 = (props) => <Typography variant="h4" {...props} />;
export const H5 = (props) => <Typography variant="h5" {...props} />;
export const H6 = (props) => <Typography variant="h6" {...props} />;
export const Subtitle1 = (props) => <Typography variant="subtitle1" {...props} />;
export const Subtitle2 = (props) => <Typography variant="subtitle2" {...props} />;
export const Body1 = (props) => <Typography variant="body1" {...props} />;
export const Body2 = (props) => <Typography variant="body2" {...props} />;
export const Caption = (props) => <Typography variant="caption" {...props} />;
export const Overline = (props) => <Typography variant="overline" {...props} />;

export default Typography; 