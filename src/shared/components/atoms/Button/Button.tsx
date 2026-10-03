import { cx } from "@/shared/utils/cx";
import { Icon, type IconName } from "../Icon/Icon";
import { buttonClasses, type ButtonStyleOptions } from "./buttonClasses";

export type { ButtonVariant } from "./buttonClasses";

export interface ButtonProps extends React.ComponentPropsWithRef<"button">, ButtonStyleOptions {
  icon?: IconName;
}

export function Button({
  variant,
  icon,
  block,
  counter,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(buttonClasses({ variant, block, counter }), className)}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}
