import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { Link as RouterLink, type LinkProps as RouterLinkProps } from "react-router-dom";
import { cx } from "./cx";
import styles from "./Link.module.css";

type NavLinkProps = { to: RouterLinkProps["to"] } & Omit<RouterLinkProps, "to">;
type ExternalLinkProps = { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>;
type ActionLinkProps = ButtonHTMLAttributes<HTMLButtonElement>;

type LinkProps = NavLinkProps | ExternalLinkProps | ActionLinkProps;

/**
 * Brand-colored inline link (prototype .link). Renders a router link when
 * given `to`, an anchor when given `href`, and a button otherwise (the
 * prototype uses it for actions like "View all").
 */
export function Link(props: LinkProps) {
  if ("to" in props) {
    const { className, ...rest } = props;
    return <RouterLink className={cx(styles.link, className)} {...rest} />;
  }
  if ("href" in props) {
    const { className, ...rest } = props;
    return <a className={cx(styles.link, className)} {...rest} />;
  }
  const { className, ...rest } = props;
  return <button type="button" className={cx(styles.link, className)} {...rest} />;
}
