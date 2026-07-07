import { Fragment } from "react";
import { NavLink } from "react-router-dom";
import { Avatar, cx, Icon, type IconName } from "../ui";
import styles from "./Sidebar.module.css";

interface NavEntry {
  to: string;
  label: string;
  icon: IconName;
  iconSize: number;
  end?: boolean;
  badge?: number;
}

interface SidebarProps {
  user: { name: string; email: string };
  /** Unread insights count (§5.11); the badge hides when 0/undefined. */
  insightsBadge?: number;
}

export function Sidebar({ user, insightsBadge }: SidebarProps) {
  // Groups and icon sizes mirror the prototype nav exactly.
  const groups: Array<{ label: string; items: NavEntry[] }> = [
    {
      label: "Overview",
      items: [
        { to: "/", label: "Dashboard", icon: "dashboard", iconSize: 17, end: true },
        { to: "/timeline", label: "Timeline", icon: "timeline", iconSize: 18 },
      ],
    },
    {
      label: "Analysis",
      items: [
        { to: "/biomarkers", label: "Biomarkers", icon: "droplet", iconSize: 16 },
        { to: "/scores", label: "Scores", icon: "gauge", iconSize: 16 },
        { to: "/insights", label: "Insights", icon: "sparkle", iconSize: 15, badge: insightsBadge },
      ],
    },
    {
      label: "Data",
      items: [
        { to: "/upload", label: "Upload", icon: "upload", iconSize: 16 },
        { to: "/settings", label: "Settings", icon: "sliders", iconSize: 17 },
      ],
    },
  ];

  return (
    <aside className={styles.side}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <Icon name="logo" size={21} />
        </div>
        <div>
          <div className={styles.bname}>BIOX</div>
          <div className={styles.bkick}>Health Intelligence</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {groups.map((group) => (
          <Fragment key={group.label}>
            <div className={styles.navk}>{group.label}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cx(styles.nitem, isActive && styles.on)}
              >
                <span className={styles.nic}>
                  <Icon name={item.icon} size={item.iconSize} />
                </span>
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={cx(styles.nbadge, styles.nbadgeAi)}>{item.badge}</span>
                )}
              </NavLink>
            ))}
          </Fragment>
        ))}
      </nav>

      <div className={styles.sfoot}>
        <NavLink to="/settings" className={styles.acct}>
          <Avatar name={user.name} />
          <div className={styles.acctInfo}>
            <div className={styles.acctName}>{user.name}</div>
            <div className={styles.acctMail}>{user.email}</div>
          </div>
          <Icon name="chevronRight" size={15} className="faint" />
        </NavLink>
      </div>
    </aside>
  );
}
