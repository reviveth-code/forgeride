import { useNavigate } from 'react-router-dom';
import WalletPage from '@/components/WalletPage';

export default function PassengerWallet() {
  const navigate = useNavigate();
  return <WalletPage onBack={() => navigate('/passenger/profile')} />;
}