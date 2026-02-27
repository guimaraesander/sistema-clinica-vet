import './Buttons.css';

// Remove quaisquer props "transientes" (ex: $mobile, $desktop) para não irem ao DOM
const sanitizeProps = (props) =>
  Object.fromEntries(
    Object.entries(props).filter(([key]) => !key.startsWith('$'))
  );

export const ButtonPrimary = ({ children, className = '', $mobile, $desktop, ...props }) => {
  const extraClasses = `${$mobile ? 'mobile ' : ''}${$desktop ? 'desktop ' : ''}`.trim();
  const safeProps = sanitizeProps(props);
  return (
    <button className={`btn-primary ${extraClasses} ${className}`.trim()} {...safeProps}>
      {children}
    </button>
  );
};

export const ButtonSecundary = ({ children, className = '', $mobile, $desktop, ...props }) => {
  const extraClasses = `${$mobile ? 'mobile ' : ''}${$desktop ? 'desktop ' : ''}`.trim();
  const safeProps = sanitizeProps(props);
  return (
    <button className={`btn-secondary ${extraClasses} ${className}`.trim()} {...safeProps}>
      {children}
    </button>
  );
};

export const ButtonIcon = ({ children, className = '', $mobile, $desktop, ...props }) => {
  const extraClasses = `${$mobile ? 'mobile ' : ''}${$desktop ? 'desktop ' : ''}`.trim();
  const safeProps = sanitizeProps(props);
  return (
    <button className={`btn-icon ${extraClasses} ${className}`.trim()} {...safeProps}>
      {children}
    </button>
  );
};

export const ButtonShop = ({ children, className = '', $mobile, $desktop, ...props }) => {
  const extraClasses = `${$mobile ? 'mobile ' : ''}${$desktop ? 'desktop ' : ''}`.trim();
  const safeProps = sanitizeProps(props);
  return (
    <button className={`btn-primary ${extraClasses} ${className}`.trim()} {...safeProps}>
      {children}
    </button>
  );
};


export const PrimaryBtn = ({ children, ...props }) => {
  return <ButtonPrimary {...props}>{children}</ButtonPrimary>;
};

export const SecundaryBtn = ({ children, ...props }) => {
  return <ButtonSecundary {...props}>{children}</ButtonSecundary>;
};

export const IconBtn = ({ children, ...props }) => {
  return <ButtonIcon {...props}>{children}</ButtonIcon>;
};

export const ShopBtn = ({ children, ...props }) => {
  return <ButtonShop {...props}>{children}</ButtonShop>;
};
