import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const BANKS = ['BCEL', 'LDB'];
const CURRENCIES = ['LAK', 'USD', 'USDT'];

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

  const titleMap = {
    topup: lang === 'lo' ? 'ຄຳຂໍເຕີມເງິນ' : 'Top Up Request',
    withdraw: lang === 'lo' ? 'ຄຳຂໍຖອນເງິນ' : 'Withdraw Request',
    send: lang === 'lo' ? 'ຄຳຂໍໂອນເງິນ' : 'Send Request',
    receive: lang === 'lo' ? 'ຄຳຂໍຮັບເງິນ' : 'Receive Request',
  };

  useEffect(() => {
    const loadAccountSettings = async () => {
      const settings = await base44.entities.WalletAccountSettings.list('-updated_date', 1);
      const item = settings[0] || null;
      setAccountSettings(item);
      if (item) {
        setBankName(item.bank_name || 'BCEL');
        setAccountNumber(item.account_number || '');
      }
    };

    loadAccountSettings();
  }, []);

  const handleSubmit = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      toast.error(lang === 'lo' ? 'ກະລຸນາໃສ່ຈຳນວນເງິນ' : 'Please enter amount');
      return;
    }
    if (type === 'topup' && (!accountNumber || !bankName)) {
      toast.error(lang === 'lo' ? 'ກະລຸນາໃສ່ເລກບັນຊີ ແລະ ທະນາຄານ' : 'Please enter account number and bank');
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

    setLoading(true);
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

    const admins = await base44.entities.User.list('-created_date', 200).then((users) => users.filter((user) => user.role === 'admin'));
    await Promise.all(admins.map((admin) => base44.entities.Notification.create({
      user_email: admin.email,
      type: '💰',
      text: `${currentUser.email} submitted a ${type} request for ${numericAmount} ${currency}`,
      text_lao: `${currentUser.email} ສົ່ງຄຳຂໍ ${type} ຈຳນວນ ${numericAmount} ${currency}`,
    })));

    setLoading(false);
    toast.success(lang === 'lo' ? 'ສົ່ງຄຳຂໍແລ້ວ' : 'Request sent for admin approval');
    onSubmitted?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 border border-border shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">{titleMap[type]}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" placeholder={lang === 'lo' ? 'ຈຳນວນເງິນ' : 'Amount'} className="w-full border border-border rounded-xl px-3 py-2 text-sm" />
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-card">
            {CURRENCIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

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
              <label className="block border-2 border-dashed border-border rounded-xl px-3 py-3 text-sm text-muted-foreground cursor-pointer hover:border-primary">
                {file ? `✅ ${file.name}` : (lang === 'lo' ? 'ແນບສະລິບການຈ່າຍ' : 'Attach payment screenshot')}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
              </label>
            </>
          )}

          {type === 'withdraw' && (
            <>
              <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-card">
                {BANKS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder={lang === 'lo' ? 'ຊື່ບັນຊີ' : 'Account Name'} className="w-full border border-border rounded-xl px-3 py-2 text-sm" />
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder={lang === 'lo' ? 'ເລກບັນຊີ' : 'Account Number'} className="w-full border border-border rounded-xl px-3 py-2 text-sm" />
              <label className="block border-2 border-dashed border-border rounded-xl px-3 py-3 text-sm text-muted-foreground cursor-pointer hover:border-primary">
                {accountQrFile ? `✅ ${accountQrFile.name}` : (lang === 'lo' ? 'ແນບ QR ຂອງບັນຊີ' : 'Attach your account QR')}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setAccountQrFile(e.target.files[0])} />
              </label>
              {accountQrFile && <img src={URL.createObjectURL(accountQrFile)} alt="Account QR" className="w-40 h-40 object-cover rounded-xl border border-border" />}
            </>
          )}

          {(type === 'send' || type === 'receive') && (
            <input value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} placeholder={lang === 'lo' ? 'ອີເມວຜູ້ໃຊ້' : 'User email'} className="w-full border border-border rounded-xl px-3 py-2 text-sm" />
          )}
        </div>

        <button onClick={handleSubmit} disabled={loading} className="w-full mt-4 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm disabled:opacity-50">
          {loading ? '...' : (lang === 'lo' ? 'ສົ່ງຄຳຂໍ' : 'Send Request')}
        </button>
      </div>
    </div>
  );
}