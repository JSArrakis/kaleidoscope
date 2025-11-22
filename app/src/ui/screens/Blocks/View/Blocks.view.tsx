import { FC } from "react";
import { BlocksViewModel } from "./Blocks.viewmodel";
import styles from "./Blocks.module.css";
import CurationItemList from "../../../components/CurationItemList/CurationItemList";

interface BlocksViewProps {
  viewModel: BlocksViewModel;
}

const BlocksView: FC<BlocksViewProps> = ({ viewModel }) => {
  return (
    <div className={styles.screen}>
      <div className={styles.screenTitle}>Blocks</div>
      <div className={styles.mainContent}>
        <div className={styles.screenFormBorder}>
          <div className={styles.screenFormBodyContainer}>
            {/* <CurationItemList
              items={viewModel.blocks.map((block) => ({
                id: block.mediaItemId,
                title: block.title,
                description: block.description,
                items: block.items,
              }))}
              type="block"
              isEditModalOpen={viewModel.isEditModalOpen}
              onAddItem={viewModel.addBlock}
              onSearch={viewModel.searchBlocks}
              onEdit={viewModel.onEdit}
              onSave={viewModel.onSave}
              onRemove={viewModel.onRemove}
            /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlocksView;
