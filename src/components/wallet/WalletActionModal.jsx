import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightLeft, X } from 'lucide-react';
import MobileSelect from '../MobileSelect';
import { firebaseClient } from '@/api/firebaseClient';
import { toast } from 'sonner';
import { DEFAULT_EXCHANGE_RATES, convertFromLak, convertToLak, exchangeWalletBalance } from '../../utils/wallet';

const BANKS = ['BCEL', 'LDB'];
const CURRENCIES = ['LAK', 'USD', 'USDT'];

function FileUploadButton({ label, accept, onChange }) {
  const ref = useRef(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="block w-full border-2 border-dashed border-border rounded-xl px-3 py-4 text-sm text-muted-foreground active:border-primary text-left min-h-[48px]"
      >
        {label}
      </button>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={onChange} />
    </>
  );
}

export default function WalletActionModal({ type, currentUser, profile, lang, onClose, onSubmitted }) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(profile?.wallet_currency || 'USD');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('BCEL');
  const [targetEmail, setTargetEmail] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accountSettings, setAccountSettings] = useState(null);
  const [accountName, setAccountName] = useState('');
  const [accountQrFile, setAccountQrFile] = useState(null);
  const [exchangeToCurrency, setExchangeToCurrency] = useState('USD');

  const titleMap = {
    topup: lang === 'lo' ? 'àº„àº³àº‚à»à»€àº•àºµàº¡à»€àº‡àº´àº™' : 'Top Up Request',
    withdraw: lang === 'lo' ? 'àº„àº³àº‚à»àº–àº­àº™à»€àº‡àº´àº™' : 'Withdraw Request',
    send: lang === 'lo' ? 'àº„àº³àº‚à»à»‚àº­àº™à»€àº‡àº´àº™' : 'Send Request',
    receive: lang === 'lo' ? 'àº„àº³àº‚à»àº®àº±àºšà»€àº‡àº´àº™' : 'Receive Request',
    exchange: lang === 'lo' ? 'à»àº¥àºàº›à»ˆàº½àº™àºªàº°àºàº¸àº™à»€àº‡àº´àº™' : 'Exchange Currency',
  };

  const exchangePreview = useMemo(() => {
    const numericAmount = Number(amount);
    if (type !== 'exchange' || !numericAmount || numericAmount <= 0 || currency === exchangeToCurrency) return null;
    const amountLak = convertToLak(numericAmount, currency, DEFAULT_EXCHANGE_RATES);
    const receivedAmount = convertFromLak(amountLak, exchangeToCurrency, DEFAULT_EXCHANGE_RATES);
    return {
      amountLak,
      receivedAmount,
    };
  }, [amount, currency, exchangeToCurrency, type]);

  useEffect(() => {
    const loadAccountSettings = async () => {
      const settings = await firebaseClient.entities.WalletAccountSettings.list('-updated_date', 1);
      const item = settings[0] || null;
      setAccountSettings(item);

      if (type === 'withdraw') {
        const savedBank = localStorage.getItem(`wallet_withdraw_bank_${currentUser.email}`);
        const savedAccountName = localStorage.getItem(`wallet_withdraw_name_${currentUser.email}`);
        const savedAccountNumber = localStorage.getItem(`wallet_withdraw_number_${currentUser.email}`);
        setBankName(savedBank || 'BCEL');
        setAccountName(savedAccountName || '');
        setAccountNumber(savedAccountNumber || '');
        return;
      }

      if (type === 'exchange') {
        setCurrency('LAK');
        setExchangeToCurrency('USD');
      }

      if (item) {
        setBankName(item.bank_name || 'BCEL');
        setAccountNumber(item.account_number || '');
      }
    };

    loadAccountSettings();
  }, [type, currentUser.email]);

  const handleSubmit = async () => {
    if (loading) return;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      toast.error(lang === 'lo' ? 'àºàº°àº¥àº¸àº™àº²à»ƒàºªà»ˆàºˆàº³àº™àº§àº™à»€àº‡àº´àº™' : 'Please enter amount');
      return;
    }
    // For top-up the account shown is the admin's receiving account (display only),
    // so we only require the amount + the payment screenshot (the bill).
    if (type === 'topup' && !file) {
      toast.error(lang === 'lo' ? 'àºàº°àº¥àº¸àº™àº²à»àº™àºšàºªàº°àº¥àº´àºšàºàº²àº™àºˆà»ˆàº²àºà»€àº‡àº´àº™' : 'Please attach your payment screenshot');
      return;
    }
    if (type === 'withdraw' && (!accountNumber || !bankName || !accountName)) {
      toast.error(lang === 'lo' ? 'àºàº°àº¥àº¸àº™àº²à»ƒàºªà»ˆàº‚à»à»‰àº¡àº¹àº™àºšàº±àº™àºŠàºµà»ƒàº«à»‰àº„àº»àºš' : 'Please enter your account details');
      return;
    }
    if ((type === 'send' || type === 'receive') && !targetEmail) {
      toast.error(lang === 'lo' ? 'àºàº°àº¥àº¸àº™àº²à»ƒàºªà»ˆàº­àºµà»€àº¡àº§àºœàº¹à»‰à»ƒàºŠà»‰' : 'Please enter user email');
      return;
    }
    if (type === 'exchange' && currency === exchangeToCurrency) {
      toast.error(lang === 'lo' ? 'à»€àº¥àº·àº­àºàºªàº°àºàº¸àº™à»€àº‡àº´àº™àº›àº²àºàº—àº²àº‡àº­àº·à»ˆàº™' : 'Choose a different target currency');
      return;
    }

    setLoading(true);

    const finishSuccess = () => {
      toast.success(type === 'exchange' ? (lang === 'lo' ? 'à»àº¥àºàº›à»ˆàº½àº™àºªàº³à»€àº¥àº±àº”' : 'Exchange completed') : (lang === 'lo' ? 'àºªàº»à»ˆàº‡àº„àº³àº‚à»à»àº¥à»‰àº§' : 'Request sent for admin approval'));
      setLoading(false);
      onSubmitted?.();
      onClose();
    };

    const finishError = () => {
      setLoading(false);
    };

    Promise.resolve()
      .then(async () => {
        if (type === 'exchange') {
          const numericAmount = Number(amount);
          const nextBalances = exchangeWalletBalance(profile, currency, exchangeToCurrency, numericAmount, DEFAULT_EXCHANGE_RATES);
          if (!nextBalances) {
            toast.error(lang === 'lo' ? 'àºàº­àº”à»€àº‡àº´àº™àºšà»à»ˆàºžà»' : 'Insufficient balance');
            return;
          }

          await firebaseClient.entities.UserProfile.update(profile.id, {
            wallet_balance_lak: nextBalances.wallet_balance_lak ?? profile.wallet_balance_lak,
            wallet_balance_usd: nextBalances.wallet_balance_usd ?? profile.wallet_balance_usd,
            wallet_balance_usdt: nextBalances.wallet_balance_usdt ?? profile.wallet_balance_usdt,
            wallet_currency: exchangeToCurrency,
          });

          await Promise.all([
            firebaseClient.entities.WalletTransaction.create({
              user_email: currentUser.email,
              description: `Exchange out ${numericAmount} ${currency}`,
              description_lao: `à»àº¥àºàº­àº­àº ${numericAmount} ${currency}`,
              amount: -numericAmount,
              currency,
              type: 'send',
              status: 'completed',
              request_kind: 'send',
              approved_by_name: currentUser.full_name || currentUser.email,
              approved_by_email: currentUser.email,
              approved_at: new Date().toISOString(),
            }),
            firebaseClient.entities.WalletTransaction.create({
              user_email: currentUser.email,
              description: `Exchange in ${nextBalances.convertedAmount} ${exchangeToCurrency}`,
              description_lao: `à»àº¥àºà»€àº‚àº»à»‰àº² ${nextBalances.convertedAmount} ${exchangeToCurrency}`,
              amount: nextBalances.convertedAmount,
              currency: exchangeToCurrency,
              type: 'received',
              status: 'completed',
              request_kind: 'receive',
              approved_by_name: currentUser.full_name || currentUser.email,
              approved_by_email: currentUser.email,
              approved_at: new Date().toISOString(),
            })
          ]);
          return;
        }

        let payment_screenshot_url = '';
        if (file) {
          const upload = await firebaseClient.integrations.Core.UploadFile({ file });
          payment_screenshot_url = upload.file_url;
        }

        let account_qr_url = '';
        if (accountQrFile) {
          const upload = await firebaseClient.integrations.Core.UploadFile({ file: accountQrFile });
          account_qr_url = upload.file_url;
        }

        await firebaseClient.entities.WalletTransaction.create({
          user_email: currentUser.email,
          description: `${type} request`,
          description_lao: `àº„àº³àº‚à» ${type}`,
          amount: numericAmount,
          currency,
          type: type === 'receive' ? 'received' : type,
          status: 'pending',
          counterparty_email: targetEmail || '',
          payment_screenshot_url,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          account_qr_url,
          request_kind: type,
        });

        if (type === 'withdraw') {
          localStorage.setItem(`wallet_withdraw_bank_${currentUser.email}`, bankName);
          localStorage.setItem(`wallet_withdraw_name_${currentUser.email}`, accountName);
          localStorage.setItem(`wallet_withdraw_number_${currentUser.email}`, accountNumber);
        }

        const admins = await firebaseClient.entities.User.list('-created_date', 200).then((users) => users.filter((user) => user.role === 'admin'));
        await Promise.all(admins.map((admin) => firebaseClient.entities.Notification.create({
          user_email: admin.email,
          type: 'ðŸ’°',
          text: `${currentUser.email} submitted a ${type} request for ${numericAmount} ${currency}`,
          text_lao: `${currentUser.email} àºªàº»à»ˆàº‡àº„àº³àº‚à» ${type} àºˆàº³àº™àº§àº™ ${numericAmount} ${currency}`,
        })));
      })
      .then(finishSuccess)
      .catch(finishError);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-card rounded-[24px] w-full sm:max-w-md p-4 sm:p-6 shadow-2xl border border-border flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="font-bold text-[15px] sm:text-lg">{titleMap[type]}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors"><X size={18} /></button>
        </div>

        <div className="space-y-4 overflow-y-auto overscroll-contain flex-1 hide-scrollbar pb-2 pr-1">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" placeholder={lang === 'lo' ? 'àºˆàº³àº™àº§àº™à»€àº‡àº´àº™' : 'Amount'} className="w-full border border-border rounded-xl px-3 py-2 text-sm" />
          <MobileSelect
            value={currency}
            onChange={setCurrency}
            options={CURRENCIES}
            placeholder={lang === 'lo' ? 'àºªàº°àºàº¸àº™à»€àº‡àº´àº™' : 'Currency'}
            label={lang === 'lo' ? 'à»€àº¥àº·àº­àºàºªàº°àºàº¸àº™à»€àº‡àº´àº™' : 'Select Currency'}
          />

          {type === 'exchange' && (
            <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{lang === 'lo' ? 'àºˆàº²àº' : 'From'}</p>
                <ArrowRightLeft size={16} className="text-muted-foreground" />
                <p className="text-sm font-semibold">{lang === 'lo' ? 'à»„àº›àº«àº²' : 'To'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-card px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-1">{lang === 'lo' ? 'àºªàº°àºàº¸àº™àº•àº»à»‰àº™àº—àº²àº‡' : 'Source currency'}</p>
                  <p className="font-semibold text-sm">{currency}</p>
                </div>
                <MobileSelect
                  value={exchangeToCurrency}
                  onChange={setExchangeToCurrency}
                  options={CURRENCIES.filter((item) => item !== currency)}
                  placeholder={lang === 'lo' ? 'àº›àº²àºàº—àº²àº‡' : 'Target'}
                  label={lang === 'lo' ? 'àºªàº°àºàº¸àº™à»€àº‡àº´àº™àº›àº²àºàº—àº²àº‡' : 'Target Currency'}
                />
              </div>
              {exchangePreview && (
                <div className="rounded-xl bg-card border border-border px-3 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground">{lang === 'lo' ? 'àº—à»ˆàº²àº™àºˆàº°à»„àº”à»‰àº®àº±àºš' : 'You will receive'}</p>
                  <p className="text-lg font-bold text-foreground">{exchangePreview.receivedAmount.toLocaleString()} {exchangeToCurrency}</p>
                  <p className="text-xs text-muted-foreground">â‰ˆ {exchangePreview.amountLak.toLocaleString()} LAK</p>
                </div>
              )}
            </div>
          )}

          {type === 'topup' && (
            <>
              <div className="rounded-2xl border border-border bg-muted/30 p-3 space-y-2 text-sm">
                <p className="font-semibold">{lang === 'lo' ? 'àºšàº±àº™àºŠàºµàºªàº³àº¥àº±àºšà»‚àº­àº™à»€àº‡àº´àº™' : 'Transfer Account'}</p>
                <p>{bankName}</p>
                {accountSettings?.account_name && <p>{accountSettings.account_name}</p>}
                <p>{accountNumber || '-'}</p>
                {accountSettings?.notes && <p className="text-muted-foreground text-xs">{accountSettings.notes}</p>}
                {accountSettings?.qr_code_url && <img src={accountSettings.qr_code_url} alt="QR code" className="w-40 h-40 object-cover rounded-xl border border-border" />}
              </div>
              <FileUploadButton
                label={file ? `âœ… ${file.name}` : (lang === 'lo' ? 'à»àº™àºšàºªàº°àº¥àº´àºšàºàº²àº™àºˆà»ˆàº²àº' : 'Attach payment screenshot')}
                accept="image/*"
                onChange={(e) => { if (e.target.files[0]) setFile(e.target.files[0]); }}
              />
            </>
          )}

          {type === 'withdraw' && (
            <>
              <MobileSelect
                value={bankName}
                onChange={setBankName}
                options={BANKS}
                placeholder={lang === 'lo' ? 'àº—àº°àº™àº²àº„àº²àº™' : 'Bank'}
                label={lang === 'lo' ? 'à»€àº¥àº·àº­àºàº—àº°àº™àº²àº„àº²àº™' : 'Select Bank'}
              />
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder={lang === 'lo' ? 'àºŠàº·à»ˆàºšàº±àº™àºŠàºµ' : 'Account Name'} className="w-full border border-border rounded-xl px-3 py-2 text-sm" />
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder={lang === 'lo' ? 'à»€àº¥àºàºšàº±àº™àºŠàºµàº‚àº­àº‡àº—à»ˆàº²àº™' : 'Your Account Number'} className="w-full border border-border rounded-xl px-3 py-2 text-sm" />
              <p className="text-xs text-muted-foreground px-1">
                {lang === 'lo' ? 'àºªàº³àº¥àº±àºšàºœàº¹à»‰à»ƒàºŠà»‰à»ƒà»à»ˆ àºŠà»ˆàº­àº‡àº™àºµà»‰àºˆàº°à»€àº›àº±àº™àº„à»ˆàº²àº«àº§à»ˆàº²àº‡ à»àº¥àº° àº¥àº°àºšàº»àºšàºˆàº°àºˆàº·à»ˆàº‚à»à»‰àº¡àº¹àº™àºšàº±àº™àºŠàºµàº‚àº­àº‡àº—à»ˆàº²àº™à»„àº§à»‰' : 'For new users this stays blank, and your own account details will be remembered after you submit.'}
              </p>
              <FileUploadButton
                label={accountQrFile ? `âœ… ${accountQrFile.name}` : (lang === 'lo' ? 'à»àº™àºš QR àº‚àº­àº‡àºšàº±àº™àºŠàºµ' : 'Attach your account QR')}
                accept="image/*"
                onChange={(e) => { if (e.target.files[0]) setAccountQrFile(e.target.files[0]); }}
              />
              {accountQrFile && <img src={URL.createObjectURL(accountQrFile)} alt="Account QR" className="w-40 h-40 object-cover rounded-xl border border-border" />}
            </>
          )}

          {(type === 'send' || type === 'receive') && (
            <input value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} placeholder={lang === 'lo' ? 'àº­àºµà»€àº¡àº§àºœàº¹à»‰à»ƒàºŠà»‰' : 'User email'} className="w-full border border-border rounded-xl px-3 py-2 text-sm" />
          )}
        </div>

        <div className="pt-4 mt-2 border-t border-border flex-shrink-0 bg-card">
          <button onClick={handleSubmit} disabled={loading} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
            {loading ? '...' : type === 'exchange' ? (lang === 'lo' ? 'àº¢àº·àº™àº¢àº±àº™àºàº²àº™à»àº¥àºàº›à»ˆàº½àº™' : 'Confirm Exchange') : (lang === 'lo' ? 'àºªàº»à»ˆàº‡àº„àº³àº‚à»' : 'Send Request')}
          </button>
        </div>
      </div>
    </div>
  );
}