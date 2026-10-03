import Link from "next/link";
import { cx } from "@/shared/utils/cx";
import { buttonClasses, type ButtonStyleOptions } from "../Button/buttonClasses";
import { Icon, type IconName } from "../Icon/Icon";

export interface ButtonLinkProps
  extends Omit<React.ComponentPropsWithRef<typeof Link>, "href">,
    Omit<ButtonStyleOptions, "counter"> {
  /** From routes.ts; never a hand-built path. */
  href: string;
  icon?: IconName;
}

/**
 * Navigation that looks like a Button ("See the Northcote menu", "View cart").
 * A real link: it opens in a new tab, and screen readers announce a link.
 * It can't be disabled; render a disabled Button instead.
 */
export function ButtonLink({
  variant,
  block,
  icon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={cx(buttonClasses({ variant, block }), className)} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
    </Link>
  );
}
