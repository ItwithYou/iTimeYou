import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightLeft, X } from 'lucide-react';
import MobileSelect from '../MobileSelect';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { convertFromLak, convertToLak, exchangeWalletBalance } from '../../utils/wallet';

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

export default function WalletActionModal({ type, currentUser, profile, lang, exchangeRates, onClose, onSubmitted }) {
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
    topup: lang === 'lo' ? 'ຄຳຂໍເຕີມເງິນ' : 'Top Up Request',
    withdraw: lang === 'lo' ? 'ຄຳຂໍຖອນເງິນ' : 'Withdraw Request',
    send: lang === 'lo' ? 'ຄຳຂໍໂອນເງິນ' : 'Send Request',
    receive: lang === 'lo' ? 'ຄຳຂໍຮັບເງິນ' : 'Receive Request',
    exchange: lang === 'lo' ? 'ແລກປ່ຽນສະກຸນເງິນ' : 'Exchange Currency',
  };

  const exchangePreview = useMemo(() => {
    const numericAmount = Number(amount);
    if (type !== 'exchange' || !numericAmount || numericAmount <= 0 || currency === exchangeToCurrency) return null;
    const amountLak = convertToLak(numericAmount, currency, exchangeRates);
    const receivedAmount = convertFromLak(amountLak, exchangeToCurrency, exchangeRates);
    return {
      amountLak,
      receivedAmount,
    };
  }, [amount, currency, exchangeToCurrency, type, exchangeRates]);

  useEffect(() => {
    const loadAccountSettings = async () => {
      const settings = await base44.entities.WalletAccountSettings.list('-updated_date', 1);
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
      toast.error(lang === 'lo' ? 'ກະລຸນາໃສ່ຈຳນວນເງິນ' : 'Please enter amount');
      return;
    }
    if (type === 'topup' && !bankName) {
      toast.error(lang === 'lo' ? 'ກະລຸນາເລືອກທະນາຄານ' : 'Please select a bank');
      return;
    }
    if (type === 'topup' && !file) {
      toast.error(lang === 'lo' ? 'ກະລຸນາແນບສະລິບ' : 'Please attach payment screenshot');
      return;
    }
    if (type === 'withdraw' && (!accountNumber || !bankName || !accountName)) {
      toast.error(lang === 'lo' ? 'ກະລຸນາໃສ່ຂໍ້ມູນບັນຊີໃຫ້ຄົບ' : 'Please enter your account details');
      return;
    }
    if ((type === 'send' || type === 'receive') && !targetEmail) {
      toast.error(lang === 'lo' ? 'ກະລຸນາໃສ່ອີເມວຜູ້ໃຊ້' : 'Please enter user email');
      return;
    }
    if (type === 'exchange' && currency === exchangeToCurrency) {
      toast.error(lang === 'lo' ? 'ເລືອກສະກຸນເງິນປາຍທາງອື່ນ' : 'Choose a different target currency');
      return;
    }

    setLoading(true);

    const finishSuccess = () => {
      toast.success(type === 'exchange' ? (lang === 'lo' ? 'ແລກປ່ຽນສຳເລັດ' : 'Exchange completed') : (lang === 'lo' ? 'ສົ່ງຄຳຂໍແລ້ວ' : 'Request sent for admin approval'));
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
          const nextBalances = exchangeWalletBalance(profile, currency, exchangeToCurrency, numericAmount, exchangeRates);
          if (!nextBalances) {
            toast.error(lang === 'lo' ? 'ຍອດເງິນບໍ່ພໍ' : 'Insufficient balance');
            return;
          }

          await base44.entities.UserProfile.update(profile.id, {
            wallet_balance_lak: nextBalances.wallet_balance_lak ?? profile.wallet_balance_lak,
            wallet_balance_usd: nextBalances.wallet_balance_usd ?? profile.wallet_balance_usd,
            wallet_balance_usdt: nextBalances.wallet_balance_usdt ?? profile.wallet_balance_usdt,
            wallet_currency: exchangeToCurrency,
          });

          await Promise.all([
            base44.entities.WalletTransaction.create({
              user_email: currentUser.email,
              description: `Exchange out ${numericAmount} ${currency}`,
              description_lao: `ແລກອອກ ${numericAmount} ${currency}`,
              amount: -numericAmount,
              currency,
              type: 'send',
              status: 'completed',
              request_kind: 'send',
              approved_by_name: currentUser.full_name || currentUser.email,
              approved_by_email: currentUser.email,
              approved_at: new Date().toISOString(),
            }),
            base44.entities.WalletTransaction.create({
              user_email: currentUser.email,
              description: `Exchange in ${nextBalances.convertedAmount} ${exchangeToCurrency}`,
              description_lao: `ແລກເຂົ້າ ${nextBalances.convertedAmount} ${exchangeToCurrency}`,
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
          const upload = await base44.integrations.Core.UploadFile({ file });
          payment_screenshot_url = upload.file_url;
        }

        let account_qr_url = '';
        if (accountQrFile) {
          const upload = await base44.integrations.Core.UploadFile({ file: accountQrFile });
          account_qr_url = upload.file_url;
        }

        await base44.entities.WalletTransaction.create({
          user_email: currentUser.email,
          description: `${type} request`,
          description_lao: `ຄຳຂໍ ${type}`,
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

        const admins = await base44.entities.User.list('-created_date', 200).then((users) => users.filter((user) => user.role === 'admin'));
        await Promise.all(admins.map((admin) => base44.entities.Notification.create({
          user_email: admin.email,
          type: '💰',
          text: `${currentUser.email} submitted a ${type} request for ${numericAmount} ${currency}`,
          text_lao: `${currentUser.email} ສົ່ງຄຳຂໍ ${type} ຈຳນວນ ${numericAmount} ${currency}`,
        })));
      })
      .then(finishSuccess)
      .catch(finishError);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} onTouchEnd={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 border border-border shadow-xl max-h-[90vh] overflow-y-auto overscroll-contain" onMouseDown={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">{titleMap[type]}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" placeholder={lang === 'lo' ? 'ຈຳນວນເງິນ' : 'Amount'} className="w-full border border-border rounded-xl px-3 py-2 text-sm" />
          <MobileSelect
            value={currency}
            onChange={setCurrency}
            options={CURRENCIES}
            placeholder={lang === 'lo' ? 'ສະກຸນເງິນ' : 'Currency'}
            label={lang === 'lo' ? 'ເລືອກສະກຸນເງິນ' : 'Select Currency'}
          />

          {type === 'exchange' && (
            <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{lang === 'lo' ? 'ຈາກ' : 'From'}</p>
                <ArrowRightLeft size={16} className="text-muted-foreground" />
                <p className="text-sm font-semibold">{lang === 'lo' ? 'ໄປຫາ' : 'To'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-card px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-1">{lang === 'lo' ? 'ສະກຸນຕົ້ນທາງ' : 'Source currency'}</p>
                  <p className="font-semibold text-sm">{currency}</p>
                </div>
                <MobileSelect
                  value={exchangeToCurrency}
                  onChange={setExchangeToCurrency}
                  options={CURRENCIES.filter((item) => item !== currency)}
                  placeholder={lang === 'lo' ? 'ປາຍທາງ' : 'Target'}
                  label={lang === 'lo' ? 'ສະກຸນເງິນປາຍທາງ' : 'Target Currency'}
                />
              </div>
              {exchangePreview && (
                <div className="rounded-xl bg-card border border-border px-3 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground">{lang === 'lo' ? 'ທ່ານຈະໄດ້ຮັບ' : 'You will receive'}</p>
                  <p className="text-lg font-bold text-foreground">{exchangePreview.receivedAmount.toLocaleString()} {exchangeToCurrency}</p>
                  <p className="text-xs text-muted-foreground">≈ {exchangePreview.amountLak.toLocaleString()} LAK</p>
                </div>
              )}
            </div>
          )}

          {type === 'topup' && (
            <>
              <div className="rounded-2xl border border-border bg-muted/30 p-3 space-y-2 text-sm">
                <p className="font-semibold">{lang === 'lo' ? 'ບັນຊີສຳລັບໂອນເງິນ' : 'Transfer Account'}</p>
                <p>{bankName}</p>
                {accountSettings?.account_name && <p>{accountSettings.account_name}</p>}
                <p>{accountNumber || '-'}</p>
                {accountSettings?.notes && <p className="text-muted-foreground text-xs">{accountSettings.notes}</p>}
                {accountSettings?.qr_code_url && <img src={accountSettings.qr_code_url} alt="QR code" className="w-40 h-40 object-cover rounded-xl border border-border" />}
              </div>
              <FileUploadButton
                label={file ? `✅ ${file.name}` : (lang === 'lo' ? 'ແນບສະລິບການຈ່າຍ' : 'Attach payment screenshot')}
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
                placeholder={lang === 'lo' ? 'ທະນາຄານ' : 'Bank'}
                label={lang === 'lo' ? 'ເລືອກທະນາຄານ' : 'Select Bank'}
              />
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder={lang === 'lo' ? 'ຊື່ບັນຊີ' : 'Account Name'} className="w-full border border-border rounded-xl px-3 py-2 text-sm" />
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder={lang === 'lo' ? 'ເລກບັນຊີຂອງທ່ານ' : 'Your Account Number'} className="w-full border border-border rounded-xl px-3 py-2 text-sm" />
              <p className="text-xs text-muted-foreground px-1">
                {lang === 'lo' ? 'ສຳລັບຜູ້ໃຊ້ໃໝ່ ຊ່ອງນີ້ຈະເປັນຄ່າຫວ່າງ ແລະ ລະບົບຈະຈື່ຂໍ້ມູນບັນຊີຂອງທ່ານໄວ້' : 'For new users this stays blank, and your own account details will be remembered after you submit.'}
              </p>
              <FileUploadButton
                label={accountQrFile ? `✅ ${accountQrFile.name}` : (lang === 'lo' ? 'ແນບ QR ຂອງບັນຊີ' : 'Attach your account QR')}
                accept="image/*"
                onChange={(e) => { if (e.target.files[0]) setAccountQrFile(e.target.files[0]); }}
              />
              {accountQrFile && <img src={URL.createObjectURL(accountQrFile)} alt="Account QR" className="w-40 h-40 object-cover rounded-xl border border-border" />}
            </>
          )}

          {(type === 'send' || type === 'receive') && (
            <input value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} placeholder={lang === 'lo' ? 'ອີເມວຜູ້ໃຊ້' : 'User email'} className="w-full border border-border rounded-xl px-3 py-2 text-sm" />
          )}
        </div>

        <button onClick={handleSubmit} disabled={loading} className="w-full mt-4 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm disabled:opacity-50">
          {loading ? '...' : type === 'exchange' ? (lang === 'lo' ? 'ຢືນຢັນການແລກປ່ຽນ' : 'Confirm Exchange') : (lang === 'lo' ? 'ສົ່ງຄຳຂໍ' : 'Send Request')}
        </button>
      </div>
    </div>
  );
}