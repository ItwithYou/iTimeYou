import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
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
    const upload = await base44.integrations.Core.UploadFile({ file: licenseFile });

    await base44.entities.UserProfile.update(profile.id, {
      business_name: businessName,
      business_tax_id: taxId,
      business_license_url: upload.file_url,
      bio: profile.bio,
      pro_verification_status: 'pending',
      pro_reject_reason: '',
    });

    await base44.entities.Notification.create({
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-card rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg p-6 shadow-xl border border-border" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{lang === 'lo' ? 'ສະໝັກ Pro' : 'Apply for Pro'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full"><X size={20} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold">{lang === 'lo' ? 'ຊື່ທຸລະກິດ' : 'Business name'}</label>
            <input value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder={lang === 'lo' ? 'ຊື່ຕາມໃບອະນຸຍາດ' : 'Name from your business license'} />
          </div>
          <div>
            <label className="text-xs font-semibold">{lang === 'lo' ? 'Tax ID' : 'Tax ID'}</label>
            <input value={taxId} onChange={e => setTaxId(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder={lang === 'lo' ? 'ເລກປະຈຳຕົວພາສີ' : 'Tax number'} />
          </div>
          <div>
            <label className="text-xs font-semibold">{lang === 'lo' ? 'ລາຍຊື່ບໍລິການທີ່ຈະເຮັດ' : 'Service names you provide'}</label>
            <textarea value={serviceNames} onChange={e => setServiceNames(e.target.value)} rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none" placeholder={lang === 'lo' ? 'ເຊັ່ນ ໂຮງແຮມ, guest house, tour...' : 'Example: hotel, guest house, tour...'} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">{lang === 'lo' ? 'ໃບອະນຸຍາດທຸລະກິດ' : 'Business license'}</label>
            <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 border-2 border-dashed border-border rounded-lg px-4 py-4 text-sm text-muted-foreground w-full text-left min-h-[48px]">
              {licenseFile ? `✅ ${licenseFile.name}` : (lang === 'lo' ? 'ກົດເພື່ອອັບໂຫລດໃບອະນຸຍາດ' : 'Tap to upload business license')}
            </button>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => setLicenseFile(e.target.files?.[0] || null)} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={submitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm mt-5 disabled:opacity-50">
          {submitting ? '...' : (lang === 'lo' ? 'ສົ່ງຄຳຂໍ Pro' : 'Submit Pro request')}
        </button>
        <button onClick={onClose} className="w-full border border-border py-2.5 rounded-lg text-sm font-semibold mt-2 hover:bg-muted transition-colors">
          {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}