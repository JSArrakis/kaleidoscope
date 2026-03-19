import { useNavigate } from 'react-router-dom';

const useRootStack = () => {
  const navigate = useNavigate();
  return navigate;
};

export default useRootStack;
