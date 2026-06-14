import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Loader2, X, Banknote, RefreshCw, ChevronLeft } from 'lucide-react';

export default function WalletPage({ onBack }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFund, setShowFund] = useState(false);
  const [amount, setAmount] = useState('');
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState('');

  const loadWallet = async () => {
    const user = await base44.auth.me();
    if (!user) return;
    const wallets = await base44.entities.Wallet.filter({ user_id: user.email });
    if (wallets.length > 0) {
      setWallet(wallets[0]);
      const txs = await base44.entities.Transaction.filter({ wallet_id: wallets[0].id }, '-created_date', 50);
      setTransactions(txs);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadWallet();
    const unsub = base44.entities.Wallet.subscribe((event) => {
      if (wallet && event.id === wallet.id) {
        setWallet(event.data);
      }
    });
    return unsub;
  }, [wallet?.id]);

  const handleFund = async () => {
    const num = parseInt(amount);
    if (!num || num < 500) {
      setError('Minimum ₦500');
      return;
    }
    setError('');
    setFunding(true);
    try {
      const res = await base44.functions.invoke('initializePaystackPayment', { amount: num });
      if (res.data?.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        setError(res.data?.error || 'Failed to initialize payment');
      }
    } catch {
      setError('Payment initialization failed. Try again.');
    } finally {
      setFunding(false);
    }
  };

  const typeConfig = {
    funding: { icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-50', label: 'Funding' },
    payment: { icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-50', label: 'Payment' },
    earning: { icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-50', label: 'Earning' },
    refund: { icon: ArrowDownLeft, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Refund' },
  };

  const statusBadge = (status) => {
    if (status === 'success') return <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Success</span>;
    if (status === 'failed') return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Failed</span>;
    return <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Pending</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-forge-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      {/* Header */}
      <div className="bg-forge-navy pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>
        <div className="flex items-center gap-3 px-5 mb-6">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <h1 className="text-xl font-bold text-white">My Wallet</h1>
        </div>

        {/* Balance card */}
        <div className="mx-5 bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/10">
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Available Balance</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white font-extrabold text-4xl">₦{(wallet?.balance || 0).toLocaleString()}</p>
              <p className="text-white/30 text-xs mt-1">Nigerian Naira (NGN)</p>
            </div>
            <button
              onClick={() => { setShowFund(true); setAmount(''); setError(''); }}
              className="bg-forge-orange text-white font-bold px-5 py-3 rounded-2xl text-sm flex items-center gap-2"
            >
              <Banknote className="w-4 h-4" /> Fund
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 -mt-4 mb-4">
        <button
          onClick={() => { setShowFund(true); setAmount(''); setError(''); }}
          className="w-full bg-card rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm"
        >
          <div className="w-10 h-10 bg-forge-orange/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Banknote className="w-5 h-5 text-forge-orange" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-foreground text-sm">Fund Wallet</p>
            <p className="text-xs text-gray-400 mt-0.5">Add money via card or bank transfer</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-300" />
        </button>
      </div>

      {/* Transaction History */}
      <div className="px-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground text-sm">Transaction History</h2>
          <button onClick={loadWallet} className="text-forge-orange flex items-center gap-1 text-xs font-semibold">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No transactions yet</p>
            <p className="text-xs text-gray-300 mt-1">Your wallet activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const cfg = typeConfig[tx.type] || typeConfig.funding;
              const Icon = cfg.icon;
              return (
                <div key={tx.id} className="bg-card rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                  <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{tx.description || cfg.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {statusBadge(tx.status)}
                      <span className="text-xs text-gray-400">
                        {new Date(tx.created_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm font-extrabold ${cfg.color}`}>
                    {(tx.type === 'funding' || tx.type === 'earning' || tx.type === 'refund') ? '+' : '-'}₦{tx.amount?.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fund Modal */}
      {showFund && (
        <div className="fixed inset-0 bg-black/40 z-[200] flex flex-col justify-end" onClick={(e) => { if (e.target === e.currentTarget) setShowFund(false); }}>
          <div className="bg-card rounded-t-3xl w-full max-w-md mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-extrabold text-foreground">Fund Wallet</h2>
              <button onClick={() => setShowFund(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₦</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError(''); }}
                    placeholder="Enter amount"
                    className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-2xl text-lg font-bold focus:outline-none focus:border-forge-orange"
                    min="500"
                  />
                </div>
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-3 gap-2">
                {[1000, 2000, 5000, 10000, 20000, 50000].map((v) => (
                  <button
                    key={v}
                    onClick={() => { setAmount(v.toString()); setError(''); }}
                    className={`py-3 rounded-2xl text-sm font-bold border transition-colors ${
                      amount === v.toString()
                        ? 'bg-forge-orange text-white border-forge-orange'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    ₦{v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}
                  </button>
                ))}
              </div>

              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

              <p className="text-xs text-gray-400">
                You'll be redirected to Paystack to complete your payment securely via card or bank transfer.
              </p>

              <button
                onClick={handleFund}
                disabled={funding}
                className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {funding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                {funding ? 'Initializing...' : 'Continue to Paystack'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}