import { FC } from "react";
import styles from "./curationItem.module.css";

export interface CurationDisplayItem {
  curationRefId: string;
  title: string;
  sequence: number;
}

interface CurationItemProps {
  curationItem: CurationDisplayItem;
}

const CurationItem: FC<CurationItemProps> = ({ curationItem }) => {
  return (
    <div className={styles.curationItem}>
      <div className={styles.curationName}>{curationItem.title}</div>
      <div className={styles.curationSequenceContainer}>
        <div className={styles.sequenceNumber}>SEQ #</div>
        <div className={styles.sequenceNumberValue}>
          {curationItem.sequence}
        </div>
      </div>
    </div>
  );
};

export default CurationItem;
