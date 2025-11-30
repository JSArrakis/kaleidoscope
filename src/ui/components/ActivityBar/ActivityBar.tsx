import { FC, CSSProperties } from 'react';
import styles from './ActivityBar.module.css';

interface ActivityBarProps {
  barStyle?: CSSProperties;
  pulseStyle?: CSSProperties;
}

const ActivityBar: FC<ActivityBarProps> = function ActivityBar({
  barStyle = {},
  pulseStyle = {},
}) {
  return (
    <div className={styles.activityBar} style={barStyle}>
      <div className={styles.pulse} style={pulseStyle} />
    </div>
  );
};

export default ActivityBar;
