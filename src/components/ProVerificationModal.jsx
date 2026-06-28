import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { firebaseClient } from '@/api/firebaseClient';
import { toast } from 'sonner';

export default function ProVerificationModal({ profile, lang, onClose, onSubmitted }) {
  const [businessName, setBusinessName] = useState(profile?.business_name || '');
  const [taxId, setTaxId] = useState(profile?.business_tax_id || '');
  const [serviceNames, setServiceNames] = useState('');
  const [licenseFile, setLicenseFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const handleSubmit = async () => {
    if (!businessName.trim() || !taxId.trim() || !serviceNames.trim() || !licenseFile) {
      toast.error(lang === 'lo' ? 'ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບ' : 'Please complete all fields');
      return;
    }

    setSubmitting(true);
    const upload = await firebaseClient.integrations.Core.UploadFile({ file: licenseFile });

    await firebaseClient.entities.UserProfile.update(profile.id, {
      business_name: businessName,
      business_tax_id: taxId,
      business_license_url: upload.file_url,
      bio: profile.bio,
      pro_verification_status: 'pending',
      pro_reject_reason: '',
    });

    await firebaseClient.entities.Notification.create({
      user_email: profile.user_email,
      type: '🔵',
      text: `Pro verification submitted. Business: ${businessName}. Services: ${serviceNames}`,
      text_lao: `ສົ່ງຄຳຂໍ Pro ແລ້ວ. ຊື່ທຸລະກິດ: ${businessName}. ບໍລິການ: ${serviceNames}`,
    });

    setSubmitting(false);
    toast.success(lang === 'lo' ? 'ສົ່ງຄຳຂໍ Pro ແລ້ວ' : 'Pro request submitted');
    onSubmitted?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="bg-card rounded-[24px] w-full sm:max-w-lg p-4 sm:p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto overscroll-contain" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 sticky top-0 bg-card z-10 pb-2 border-b border-border">
          <h2 className="text-[15px] sm:text-lg font-bold">{lang === 'lo' ? 'ສະໝັກ Pro' : 'Apply for Pro'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors"><X size={18} /></button>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="text-[11px] font-semibold block mb-1">{lang === 'lo' ? 'ຊື່ທຸລະກິດ' : 'Business name'}</label>
            <input value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary" placeholder={lang === 'lo' ? 'ຊື່ຕາມໃບອະນຸຍາດ' : 'Name from your business license'} />
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1">{lang === 'lo' ? 'Tax ID' : 'Tax ID'}</label>
            <input value={taxId} onChange={e => setTaxId(e.target.value)} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary" placeholder={lang === 'lo' ? 'ເລກປະຈຳຕົວພາສີ' : 'Tax number'} />
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1">{lang === 'lo' ? 'ລາຍຊື່ບໍລິການທີ່ຈະເຮັດ' : 'Service names you provide'}</label>
            <textarea value={serviceNames} onChange={e => setServiceNames(e.target.value)} rows={2} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm resize-none outline-none focus:border-primary" placeholder={lang === 'lo' ? 'ເຊັ່ນ ໂຮງແຮມ, guest house, tour...' : 'Example: hotel, guest house, tour...'} />
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1">{lang === 'lo' ? 'ໃບອະນຸຍາດທຸລະກິດ' : 'Business license'}</label>
            <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 border border-dashed border-border rounded-lg px-3 py-2 text-xs text-muted-foreground active:border-primary transition-colors w-full text-left">
              {licenseFile ? `✅ ${licenseFile.name}` : (lang === 'lo' ? '📄 ກົດເພື່ອອັບໂຫລດໃບອະນຸຍາດ' : '📄 Tap to upload business license')}
            </button>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => setLicenseFile(e.target.files?.[0] || null)} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={submitting} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm mt-4 hover:bg-blue-700 transition-colors disabled:opacity-50">
          {submitting ? '...' : (lang === 'lo' ? 'ສົ່ງຄຳຂໍ Pro' : 'Submit Pro request')}
        </button>
      </div>
    </div>
  );
}