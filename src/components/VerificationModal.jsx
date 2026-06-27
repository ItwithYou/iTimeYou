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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} onTouchEnd={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-card rounded-[24px] p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border overscroll-contain" onMouseDown={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 sticky top-0 bg-card z-10 pb-2 border-b border-border">
          <h2 className="text-[15px] sm:text-lg font-bold">{t.verifyTitle}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors"><X size={18} /></button>
        </div>

        {/* Step 1 */}
        <div className="flex gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</div>
          <div className="flex-1 space-y-2">
            <div className="font-semibold text-[13px]">Personal Information</div>
            <div>
              <label className="text-[11px] font-semibold">{t.fullName}</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary" placeholder="As shown on your ID" />
            </div>
            <div>
              <label className="text-[11px] font-semibold">{t.dob}</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</div>
          <div className="flex-1 space-y-2">
            <div className="font-semibold text-[13px]">Identity Documents</div>
            <div>
              <label className="text-[11px] font-semibold">{t.idDoc}</label>
              <button
                type="button"
                onClick={() => idInputRef.current?.click()}
                className="flex items-center gap-2 border border-dashed border-border rounded-lg px-3 py-2 text-xs text-muted-foreground active:border-primary transition-colors w-full text-left"
              >
                {idFile ? `✅ ${idFile.name}` : '📄 Tap to upload (Passport / National ID)'}
              </button>
              <input ref={idInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files[0]) setIdFile(e.target.files[0]); }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold">{t.selfieId}</label>
              <button
                type="button"
                onClick={() => selfieInputRef.current?.click()}
                className="flex items-center gap-2 border border-dashed border-border rounded-lg px-3 py-2 text-xs text-muted-foreground active:border-primary transition-colors w-full text-left"
              >
                {selfieFile ? `✅ ${selfieFile.name}` : '🤳 Tap to upload selfie holding your ID'}
              </button>
              <input ref={selfieInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { if (e.target.files[0]) setSelfieFile(e.target.files[0]); }} />
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-2 mb-4">
          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</div>
          <div className="flex-1 space-y-1">
            <div className="font-semibold text-[13px]">Agreement</div>
            <button type="button" onClick={() => setTermsChecked(!termsChecked)} className="flex items-start gap-2 text-xs text-left py-1">
              <input type="checkbox" checked={termsChecked} readOnly className="mt-0.5 accent-primary w-4 h-4 flex-shrink-0 pointer-events-none" />
              <span>{t.termsAgree}</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? '...' : t.submitVerify}
        </button>
      </div>
    </div>
  );
}