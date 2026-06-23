import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Loader2, X, Banknote, RefreshCw, ChevronLeft, Send, Building2 } from 'lucide-react';
import BottomSheetPicker from '@/components/BottomSheetPicker';

const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'First Bank', code: '011' },
  { name: 'GTBank', code: '058' },
  { name: 'UBA', code: '033' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Opay', code: '100004' },
  { name: 'PalmPay', code: '100033' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'Union Bank', code: '032' },
  { name: 'Stanbic IBTC', code: '221' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Ecobank', code: '050' },
  { name: 'Wema Bank', code: '035' },
  { name: 'FCMB', code: '214' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Providus Bank', code: '101' },
];

export default function WalletPage({ onBack, canWithdraw }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFund, setShowFund] = useState(false);
  const [amount, setAmount] = useState('');
  const [funding, setFunding] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [error, setError] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);

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

  const handleWithdraw = async () => {
    const num = parseInt(withdrawAmount);
    if (!num || num < 500) {
      setWithdrawError('Minimum ₦500');
      return;
    }
    if (num > (wallet?.balance || 0)) {
      setWithdrawError('Insufficient balance');
      return;
    }
    if (accountNumber.length !== 10) {
      setWithdrawError('Enter a valid 10-digit account number');
      return;
    }
    if (!bankCode) {
      setWithdrawError('Select a bank');
      return;
    }
    setWithdrawError('');
    setWithdrawing(true);
    try {
      const res = await base44.functions.invoke('processWithdrawal', {
        amount: num,
        account_number: accountNumber,
        bank_code: bankCode,
      });
      if (res.data?.success) {
        setWithdrawSuccess(res.data.message || `₦${num.toLocaleString()} withdrawal processing`);
        setShowWithdraw(false);
        setWithdrawAmount('');
        setAccountNumber('');
        setBankCode('');
        loadWallet();
        setTimeout(() => setWithdrawSuccess(''), 5000);
      } else {
        setWithdrawError(res.data?.error || 'Withdrawal failed');
      }
    } catch {
      setWithdrawError('Withdrawal failed. Try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  const typeConfig = {
    funding: { icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-50', label: 'Funding' },
    payment: { icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-50', label: 'Payment' },
    earning: { icon: ArrowDownLeft, color: 'text-green-500', bg: 'bg-green-50', label: 'Earning' },
    refund: { icon: ArrowDownLeft, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Refund' },
    withdrawal: { icon: ArrowUpRight, color: 'text-red-500', bg: 'bg-red-50', label: 'Withdrawal' },
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
            <button onClick={onBack} aria-label="Go back" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-white" aria-hidden="true" />
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

      {/* Success banner */}
      {withdrawSuccess && (
        <div className="px-5 -mt-2 mb-2">
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-green-700 text-sm font-bold flex items-center gap-2">
            ✅ {withdrawSuccess}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 -mt-4 mb-4 space-y-2">
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

        {canWithdraw && (
          <button
            onClick={() => { setShowWithdraw(true); setWithdrawAmount(''); setAccountNumber(''); setBankCode(''); setWithdrawError(''); }}
            className="w-full bg-card rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm"
          >
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Send className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground text-sm">Withdraw</p>
              <p className="text-xs text-gray-400 mt-0.5">Send money to your bank account</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300" />
          </button>
        )}
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

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/40 z-[210] flex flex-col justify-end" onClick={(e) => { if (e.target === e.currentTarget) setShowWithdraw(false); }}>
          <div className="bg-card rounded-t-3xl w-full max-w-md mx-auto p-6" role="dialog" aria-modal="true" aria-label="Withdraw to bank">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-extrabold text-foreground">Withdraw to Bank</h2>
              <button onClick={() => setShowWithdraw(false)} aria-label="Close withdraw dialog" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₦</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => { setWithdrawAmount(e.target.value); setWithdrawError(''); }}
                    placeholder="Enter amount"
                    className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-2xl text-lg font-bold focus:outline-none focus:border-forge-orange"
                    min="500"
                    max={wallet?.balance}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Balance: ₦{(wallet?.balance || 0).toLocaleString()}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Account Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, '')); setWithdrawError(''); }}
                  placeholder="10-digit NUBAN account number"
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-forge-orange"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2" htmlFor="bank-select">Bank</label>
                <button
                  type="button"
                  id="bank-select"
                  onClick={() => setShowBankPicker(true)}
                  aria-haspopup="dialog"
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-forge-orange bg-card text-left flex items-center justify-between"
                >
                  <span className={bankCode ? 'text-foreground' : 'text-gray-400'}>
                    {bankCode ? NIGERIAN_BANKS.find(b => b.code === bankCode)?.name : 'Select your bank'}
                  </span>
                  <Building2 className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </button>
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-3 gap-2">
                {[1000, 2000, 5000, 10000, 20000, (wallet?.balance || 0)].filter(v => v > 0).slice(0, 6).map((v) => (
                  <button
                    key={v}
                    onClick={() => { setWithdrawAmount(v.toString()); setWithdrawError(''); }}
                    className={`py-3 rounded-2xl text-sm font-bold border transition-colors ${
                      withdrawAmount === v.toString()
                        ? 'bg-forge-orange text-white border-forge-orange'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    ₦{v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}
                  </button>
                ))}
              </div>

              {withdrawError && <p className="text-sm text-red-500 font-medium">{withdrawError}</p>}

              <p className="text-xs text-gray-400">
                Funds will be transferred to your bank account via Paystack. This usually takes a few minutes.
              </p>

              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="w-full bg-forge-orange text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {withdrawing ? 'Processing...' : 'Withdraw to Bank'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fund Modal */}
      {showFund && (
        <div className="fixed inset-0 bg-black/40 z-[200] flex flex-col justify-end" onClick={(e) => { if (e.target === e.currentTarget) setShowFund(false); }}>
          <div className="bg-card rounded-t-3xl w-full max-w-md mx-auto p-6" role="dialog" aria-modal="true" aria-label="Fund wallet">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-extrabold text-foreground">Fund Wallet</h2>
              <button onClick={() => setShowFund(false)} aria-label="Close fund dialog" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
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

      <BottomSheetPicker
        open={showBankPicker}
        onClose={() => setShowBankPicker(false)}
        title="Select your bank"
        options={NIGERIAN_BANKS.map(b => ({ value: b.code, label: b.name }))}
        value={bankCode}
        onChange={(val) => { setBankCode(val); setWithdrawError(''); }}
      />
    </div>
  );
}