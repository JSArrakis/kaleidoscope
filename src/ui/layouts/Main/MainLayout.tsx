import { FC } from 'react';
import MainLayoutView, { useMainLayoutViewModel } from './View';

const MainLayout: FC = () => {
  const viewModel = useMainLayoutViewModel();

  return <MainLayoutView viewModel={viewModel} />;
};

export default MainLayout;
