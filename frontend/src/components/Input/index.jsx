import './Input.css';

const sanitizeProps = (props) =>
  Object.fromEntries(
    Object.entries(props).filter(([key]) => !key.startsWith('$'))
  );

export const InputDefault = ({ className = '', $inputLogin, ...props }) => {
  const inputClasses = `input-default ${$inputLogin ? 'input-login' : ''} ${className}`;
  const safeProps = sanitizeProps(props);
  
  return (
    <input className={inputClasses} {...safeProps} />
  );
};
