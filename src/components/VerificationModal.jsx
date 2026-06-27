import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { X } from 'lucide-react';

export default function VerificationModal({ profile, t, lang, onClose, onSubmitted }) {
  const [name, setName] = useState(`${profile.first_name} ${profile.last_name}`);
  const [dob, setDob] = useState('');
  const [idFile, setIdFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [termsChecked, setTermsChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const idInputRef = useRef(null);
  const selfieInputRef = useRef(null);

  const handleSubmit = async () => {
    if (!name || !dob) { toast.error(lang === 'lo' ? 'ກະລຸນາຕື່ມຂໍ້ມູນ' : 'Please fill all fields'); return; }
    if (!idFile || !selfieFile) {
      toast.error(lang === 'lo' ? 'ກະລຸນາອັບໂຫລດເອກະສານໃຫ້ຄົບ' : 'Please upload your ID and ID selfie');
      return;
    }
    if (!termsChecked) { toast.error(t.termsAgree); return; }

    setSubmitting(true);
    let id_url = '', selfie_url = '';
    if (idFile) {
      const res = await base44.integrations.Core.UploadFile({ file: idFile });
      id_url = res.file_url;
    }
    if (selfieFile) {
      const res = await base44.integrations.Core.UploadFile({ file: selfieFile });
      selfie_url = res.file_url;
    }

    await base44.entities.UserProfile.update(profile.id, {
      verification_status: 'pending',
      verification_name: name,
      verification_dob: dob,
      id_document_url: id_url,
      selfie_url: selfie_url,
    });

    await base44.entities.Notification.create({
      user_email: profile.user_email,
      type: '🔐',
      text: 'Identity verification submitted — under review ⏳',
      text_lao: 'ສົ່ງຢືນຢັນຕົວຕົນ ⏳',
    });

    setSubmitting(false);
    toast.success(lang === 'lo' ? 'ສົ່ງຂໍ້ມູນແລ້ວ! ⏳' : 'Submitted for review! ⏳');
    onSubmitted();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} onTouchEnd={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-card rounded-2xl p-6 max-w-lg w-full max-h-[75vh] md:max-h-[85vh] overflow-y-auto shadow-xl overscroll-contain" onMouseDown={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t.verifyTitle}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full"><X size={20} /></button>
        </div>

        <div className="bg-emerald-50 rounded-lg p-3 text-sm text-emerald-700 mb-5 leading-relaxed">
          {t.verFeats}
        </div>

        {/* Step 1 */}
        <div className="flex gap-3 mb-4">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
          <div className="flex-1 space-y-3">
            <div className="font-semibold text-sm">Personal Information</div>
            <div>
              <label className="text-xs font-semibold">{t.fullName}</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="As shown on your ID" />
            </div>
            <div>
              <label className="text-xs font-semibold">{t.dob}</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-3 mb-4">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
          <div className="flex-1 space-y-3">
            <div className="font-semibold text-sm">Identity Documents</div>
            <div>
              <label className="text-xs font-semibold">{t.idDoc}</label>
              <button
                type="button"
                onClick={() => idInputRef.current?.click()}
                className="flex items-center gap-2 border-2 border-dashed border-border rounded-lg px-4 py-4 text-sm text-muted-foreground active:border-primary transition-colors w-full text-left min-h-[48px]"
              >
                {idFile ? `✅ ${idFile.name}` : '📄 Tap to upload (Passport / National ID)'}
              </button>
              <input ref={idInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files[0]) setIdFile(e.target.files[0]); }} />
            </div>
            <div>
              <label className="text-xs font-semibold">{t.selfieId}</label>
              <button
                type="button"
                onClick={() => selfieInputRef.current?.click()}
                className="flex items-center gap-2 border-2 border-dashed border-border rounded-lg px-4 py-4 text-sm text-muted-foreground active:border-primary transition-colors w-full text-left min-h-[48px]"
              >
                {selfieFile ? `✅ ${selfieFile.name}` : '🤳 Tap to upload selfie holding your ID'}
              </button>
              <input ref={selfieInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { if (e.target.files[0]) setSelfieFile(e.target.files[0]); }} />
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-3 mb-6">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
          <div className="flex-1 space-y-2">
            <div className="font-semibold text-sm">Agreement</div>
            <button type="button" onClick={() => setTermsChecked(!termsChecked)} className="flex items-start gap-3 text-sm text-left py-1 min-h-[44px]">
              <input type="checkbox" checked={termsChecked} readOnly className="mt-0.5 accent-primary w-5 h-5 flex-shrink-0 pointer-events-none" />
              <span>{t.termsAgree}</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? '...' : t.submitVerify}
        </button>
        <button onClick={onClose} className="w-full border border-border py-2.5 rounded-lg text-sm font-semibold mt-2 hover:bg-muted transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}