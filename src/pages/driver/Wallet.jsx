import { useNavigate } from 'react-router-dom';
import WalletPage from '@/components/WalletPage';

export default function DriverWallet() {
  const navigate = useNavigate();
  return <WalletPage onBack={() => navigate('/driver/profile')} />;
}