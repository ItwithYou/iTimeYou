import React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../lib/AppContext';
import CreateServicePost from '../components/CreateServicePost';
import CreateListing from '../components/CreateListing';
import { ArrowLeft } from 'lucide-react';

export default function CreatePost() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'personal'; // 'personal' or 'business'
  const { profile, currentUser, lang, t } = useAppContext();
  const navigate = useNavigate();

  const handlePosted = () => {
    navigate(type === 'business' ? '/explore' : '/feed');
  };

  const isVerified = profile?.is_pro || profile?.is_verified;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 pb-32 min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-3 p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl md:text-2xl font-bold">
          {type === 'business' 
            ? (lang === 'lo' ? 'ລົງລາຍການທຸລະກິດໃໝ່' : 'Create Business Listing') 
            : (lang === 'lo' ? 'ສ້າງໂພສບໍລິການສ່ວນບຸກຄົນ' : 'Create Personal Service Post')}
        </h1>
      </div>

      {/* Verification Check */}
      {!isVerified ? (
        <div className="bg-gradient-to-br from-card to-card/50 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center border border-border shadow-lg shadow-black/5 text-center mt-10">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 border border-border/50">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-lg font-bold mb-2">
            {lang === 'lo' ? 'ຕ້ອງຢືນຢັນບັນຊີກ່ອນ' : 'Account verification required'}
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            {lang === 'lo' 
              ? 'ເພື່ອຄວາມປອດໄພຂອງຊຸມຊົນ, ກະລຸນາຢືນຢັນບັນຊີຂອງທ່ານກ່ອນຈຶ່ງສາມາດລົງໂພສໄດ້.' 
              : 'For community safety, please verify your account before you can start posting.'}
          </p>
          <Link 
            to={`/profile/${profile?.id || ''}`} 
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold shadow-md hover:opacity-90 transition-all hover:-translate-y-0.5"
          >
            {lang === 'lo' ? 'ໄປຢືນຢັນບັນຊີດຽວນີ້' : 'Verify Account Now'}
          </Link>
        </div>
      ) : (
        /* Form */
        <div className="w-full">
          {type === 'business' ? (
            <CreateListing
              profile={{ ...profile, first_name: profile.business_name || profile.first_name, last_name: '' }}
              currentUser={currentUser}
              lang={lang}
              t={t}
              onPosted={handlePosted}
              defaultOpen={true}
            />
          ) : (
            <CreateServicePost
              profile={profile}
              currentUser={currentUser}
              lang={lang}
              t={t}
              onPosted={handlePosted}
              defaultOpen={true}
            />
          )}
        </div>
      )}
    </div>
  );
}
