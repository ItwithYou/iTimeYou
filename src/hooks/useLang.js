import { useState, useCallback } from 'react';

const translations = {
  en: {
    heroTitle: 'Share Culture, Stay Together',
    heroLao: 'ແບ່ງປັນວັດທະນະທຳ, ພັກເຊົາຮ່ວມກັນ',
    heroDesc: 'Schedule experiences, share culture, find homes, discover foods, and connect with people worldwide.',
    search: 'Search', searchPlaceholder: 'Where do you want to go?',
    featTitle: 'Everything in One App', featSub: 'ທຸກຢ່າງຢູ່ໃນແອັບດຽວ',
    featListTitle: 'Featured Stays & Experiences', seeAll: 'See all →',
    ctaTitle: 'Join iTimeYou Today', ctaDesc: 'Create your account and start sharing culture, booking stays, and connecting.',
    getStarted: 'Get Started', explore: 'Business',
    feed: 'Personal', trips: 'Transactions', wallet: 'Wallet', messages: 'Messages', profile: 'Profile', logout: 'Logout',
    notifications: 'Notifications', markRead: 'Mark all read',
    perNight: '/night', guests: 'guests', beds: 'beds', bath: 'bath', total: 'total',
    postPlaceholder: 'Share your culture, experience, or recommendation...',
    post: 'Post', like: 'Like', comment: 'Comment', share: 'Share',
    likes: 'likes', comments: 'comments', writeComment: 'Write a comment...',
    bookingsTitle: 'My Transactions', noBookings: 'No transactions yet',
    nights: 'nights', cleaning: 'Cleaning', service: 'Service',
    requestBook: 'Request to Book', payViaWallet: 'Pay via eWallet',
    bookingRequested: 'Booking Requested!', paidVia: 'Paid via eWallet',
    viewBookings: 'View Bookings', selectDates: 'Please select dates',
    insufficientBalance: 'Insufficient balance',
    walletTitle: 'My eWallet', balance: 'Balance', topUp: 'Top Up', withdraw: 'Withdraw',
    send: 'Send', receive: 'Receive', history: 'Transaction History',
    needsVerify: 'Please verify your account to use this feature.',
    verifyNow: 'Get Verified 🔐',
    verifyTitle: 'Verify Your Identity',
    verFeats: 'Verified accounts can: use eWallet, receive payments, host & list spaces, book stays.',
    verStatus: 'Verified ✅', verPending: 'Verification Pending ⏳', notVerified: 'Not Verified',
    fullName: 'Full Legal Name', dob: 'Date of Birth',
    idDoc: 'ID Document', selfieId: 'Selfie with ID',
    ageConfirm: 'I confirm I am 18 years of age or older',
    termsAgree: 'I agree to Terms of Service & Privacy Policy',
    submitVerify: 'Submit for Verification',
    editProfile: 'Edit Profile', saveChanges: 'Save Changes', profileSaved: 'Profile saved!',
    trustTitle: 'Trust Score', trustDesc: 'Build trust by completing bookings and getting reviews',
    goldTrust: 'Gold Trust', silverTrust: 'Silver Trust', bronzeTrust: 'Bronze Trust',
    hostedBy: 'Hosted by', about: 'About', amenities: 'Amenities',
    message: 'Message', selectConversation: 'Select a conversation',
    typeMessage: 'Type a message...',
    noResults: 'No results found', resultsFound: 'results found',
    reviews: 'reviews', posts: 'Posts', listings: 'Listings',
    noPosts: 'No posts yet', noListings: 'No listings yet',
    friends: 'friends', joined: 'Joined', host: 'Host',
    noMessages: 'No messages', justNow: 'Just now',
    rateUser: 'Rate this user', submitReview: 'Submit Review',
    yourRating: 'Your rating', writeReview: 'Write a review (optional)...',
    reviewSubmitted: 'Review submitted!', alreadyReviewed: 'You already reviewed this user',
    topupSuccess: 'Top up successful!', withdrawSuccess: 'Withdrawal successful!',
    categories: ['Culture', 'Stay', 'Food', 'Experience', 'Home', 'Nature'],
    features: [
      { icon: '🏛️', title: 'Culture Sharing', desc: 'Share traditions, festivals, and local customs with travelers.' },
      { icon: '🏠', title: 'Book Stays', desc: 'Find unique homes, villas, and local accommodations.' },
      { icon: '🍜', title: 'Discover Foods', desc: 'Find authentic local cuisine and food experiences.' },
      { icon: '💰', title: 'eWallet', desc: 'Secure in-app payments with built-in digital wallet.' },
      { icon: '⭐', title: 'Trust Ratings', desc: 'Build trust through verified reviews and star ratings.' },
      { icon: '💬', title: 'Social Feed', desc: 'Connect, chat, and share experiences with the community.' },
      { icon: '📅', title: 'Schedule', desc: 'Plan and schedule cultural experiences and meetups.' },
      { icon: '🌏', title: 'Bilingual', desc: 'Full support for English and Lao (ພາສາລາວ).' }
    ],
  },
  lo: {
    heroTitle: 'ແບ່ງປັນວັດທະນະທຳ, ພັກເຊົາຮ່ວມກັນ',
    heroLao: 'Share Culture, Stay Together',
    heroDesc: 'ກຳນົດການ, ແບ່ງປັນວັດທະນະທຳ, ຊອກຫາທີ່ພັກ, ຄົ້ນພົບອາຫານ, ແລະເຊື່ອມຕໍ່ກັບຄົນທົ່ວໂລກ.',
    search: 'ຄົ້ນຫາ', searchPlaceholder: 'ທ່ານຢາກໄປໃສ?',
    featTitle: 'ທຸກຢ່າງຢູ່ໃນແອັບດຽວ', featSub: 'Everything in One App',
    featListTitle: 'ທີ່ພັກ ແລະ ປະສົບການແນະນຳ', seeAll: 'ເບິ່ງທັງໝົດ →',
    ctaTitle: 'ເຂົ້າຮ່ວມ iTimeYou ມື້ນີ້', ctaDesc: 'ສ້າງບັນຊີ ແລະ ເລີ່ມແບ່ງປັນວັດທະນະທຳ, ຈອງທີ່ພັກ.',
    getStarted: 'ເລີ່ມຕົ້ນ', explore: 'ທຸລະກິດ',
    feed: 'ສ່ວນຕົວ', trips: 'ທຸລະກຳ', wallet: 'ກະເປົາ', messages: 'ຂໍ້ຄວາມ', profile: 'ໂປຣໄຟລ໌', logout: 'ອອກ',
    notifications: 'ແຈ້ງເຕືອນ', markRead: 'ອ່ານທັງໝົດ',
    perNight: '/ຄືນ', guests: 'ຄົນ', beds: 'ຕຽງ', bath: 'ຫ້ອງນ້ຳ', total: 'ລວມ',
    postPlaceholder: 'ແບ່ງປັນວັດທະນະທຳ, ປະສົບການ, ຫຼືຄຳແນະນຳ...',
    post: 'ໂພສ', like: 'ຖືກໃຈ', comment: 'ຄຳເຫັນ', share: 'ແຊຣ໌',
    likes: 'ຖືກໃຈ', comments: 'ຄຳເຫັນ', writeComment: 'ຂຽນຄຳເຫັນ...',
    bookingsTitle: 'ທຸລະກຳຂອງຂ້ອຍ', noBookings: 'ຍັງບໍ່ມີທຸລະກຳ',
    nights: 'ຄືນ', cleaning: 'ຄ່າທຳຄວາມສະອາດ', service: 'ຄ່າບໍລິການ',
    requestBook: 'ຂໍຈອງ', payViaWallet: 'ຊຳລະຜ່ານ eWallet',
    bookingRequested: 'ຂໍຈອງສຳເລັດ!', paidVia: 'ຊຳລະຜ່ານ eWallet',
    viewBookings: 'ເບິ່ງການຈອງ', selectDates: 'ກະລຸນາເລືອກວັນທີ',
    insufficientBalance: 'ຍອດເງິນບໍ່ພໍ',
    walletTitle: 'ກະເປົາເງິນ', balance: 'ຍອດເງິນ', topUp: 'ເຕີມເງິນ', withdraw: 'ຖອນເງິນ',
    send: 'ໂອນເງິນ', receive: 'ຮັບເງິນ', history: 'ປະຫວັດທຸລະກຳ',
    needsVerify: 'ກະລຸນາຢືນຢັນບັນຊີກ່ອນໃຊ້ຟັງຊັ່ນນີ້.',
    verifyNow: 'ຢືນຢັນຕົວຕົນ 🔐',
    verifyTitle: 'ຢືນຢັນຕົວຕົນຂອງທ່ານ',
    verFeats: 'ບັນຊີທີ່ຢືນຢັນແລ້ວ: ໃຊ້ eWallet, ຮັບເງິນ, ຈອງ ແລະ ໃຫ້ເຊົ່າ.',
    verStatus: 'ຢືນຢັນແລ້ວ ✅', verPending: 'ກຳລັງດຳເນີນການ ⏳', notVerified: 'ຍັງບໍ່ຢືນຢັນ',
    fullName: 'ຊື່ຕາມໃບຜ່ານແດນ', dob: 'ວັນເດືອນປີເກີດ',
    idDoc: 'ໃບຜ່ານແດນ / ບັດປະຈຳຕົວ', selfieId: 'ຮູບເຊລຟີ',
    ageConfirm: 'ຂ້ອຍຢືນຢັນວ່າມີອາຍຸ 18 ປີ ຫຼື ຫຼາຍກວ່ານັ້ນ',
    termsAgree: 'ຂ້ອຍຕົກລົງຕາມຂໍ້ກຳນົດ ແລະ ນະໂຍບາຍ',
    submitVerify: 'ສົ່ງຂໍ້ມູນ',
    editProfile: 'ແກ້ໄຂໂປຣໄຟລ໌', saveChanges: 'ບັນທຶກ', profileSaved: 'ບັນທຶກສຳເລັດ!',
    trustTitle: 'ຄະແນນຄວາມໜ້າເຊື່ອຖື', trustDesc: 'ສ້າງຄວາມໜ້າເຊື່ອຖືໂດຍສຳເລັດການຈອງ ແລະ ຮັບລີວິວ',
    goldTrust: 'ຄວາມໜ້າເຊື່ອຖືທອງ', silverTrust: 'ຄວາມໜ້າເຊື່ອຖືເງິນ', bronzeTrust: 'ຄວາມໜ້າເຊື່ອຖືທອງແດງ',
    hostedBy: 'ເຈົ້າພາບ:', about: 'ກ່ຽວກັບ', amenities: 'ສິ່ງອຳນວຍຄວາມສະດວກ',
    message: 'ຂໍ້ຄວາມ', selectConversation: 'ເລືອກການສົນທະນາ',
    typeMessage: 'ພິມຂໍ້ຄວາມ...',
    noResults: 'ບໍ່ພົບຜົນ', resultsFound: 'ຜົນໄດ້ຮັບ',
    reviews: 'ລີວິວ', posts: 'ໂພສ', listings: 'ລາຍການ',
    noPosts: 'ຍັງບໍ່ມີໂພສ', noListings: 'ຍັງບໍ່ມີລາຍການ',
    friends: 'ໝູ່', joined: 'ເຂົ້າຮ່ວມ', host: 'ເຈົ້າພາບ',
    noMessages: 'ບໍ່ມີຂໍ້ຄວາມ', justNow: 'ດຽວນີ້',
    rateUser: 'ໃຫ້ຄະແນນຜູ້ໃຊ້ນີ້', submitReview: 'ສົ່ງລີວິວ',
    yourRating: 'ຄະແນນຂອງທ່ານ', writeReview: 'ຂຽນລີວິວ (ທາງເລືອກ)...',
    reviewSubmitted: 'ສົ່ງລີວິວສຳເລັດ!', alreadyReviewed: 'ທ່ານລີວິວແລ້ວ',
    topupSuccess: 'ເຕີມສຳເລັດ!', withdrawSuccess: 'ຖອນສຳເລັດ!',
    categories: ['ວັດທະນະທຳ', 'ທີ່ພັກ', 'ອາຫານ', 'ປະສົບການ', 'ເຮືອນ', 'ທຳມະຊາດ'],
    features: [
      { icon: '🏛️', title: 'ແບ່ງປັນວັດທະນະທຳ', desc: 'ແບ່ງປັນປະເພນີ, ບຸນ, ແລະ ວັດທະນະທຳທ້ອງຖິ່ນ.' },
      { icon: '🏠', title: 'ຈອງທີ່ພັກ', desc: 'ຊອກຫາເຮືອນ, ວິລ່າ, ແລະ ທີ່ພັກທ້ອງຖິ່ນ.' },
      { icon: '🍜', title: 'ຄົ້ນພົບອາຫານ', desc: 'ຊອກຫາອາຫານທ້ອງຖິ່ນ ແລະ ປະສົບການອາຫານ.' },
      { icon: '💰', title: 'ກະເປົາເງິນ', desc: 'ຊຳລະເງິນໃນແອັບດ້ວຍກະເປົາເງິນດິຈິທັລ.' },
      { icon: '⭐', title: 'ລະບົບຄວາມໜ້າເຊື່ອຖື', desc: 'ສ້າງຄວາມໜ້າເຊື່ອຖືຜ່ານລີວິວ ແລະ ດາວ.' },
      { icon: '💬', title: 'ຟີດສັງຄົມ', desc: 'ເຊື່ອມຕໍ່, ແຊັດ, ແລະ ແບ່ງປັນປະສົບການ.' },
      { icon: '📅', title: 'ກຳນົດການ', desc: 'ວາງແຜນ ແລະ ກຳນົດປະສົບການວັດທະນະທຳ.' },
      { icon: '🌏', title: 'ສອງພາສາ', desc: 'ຮອງຮັບພາສາອັງກິດ ແລະ ພາສາລາວ.' }
    ],
  }
};

const CAT_KEYS = ['culture', 'stay', 'food', 'experience', 'home', 'nature'];
const CAT_ICONS = { culture: '🏛️', stay: '🏠', food: '🍜', experience: '🎭', home: '🏡', nature: '🌿' };

export { CAT_KEYS, CAT_ICONS };

export default function useLang() {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('itimeyou_lang') || 'lo'; } catch { return 'lo'; }
  });

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('itimeyou_lang', l); } catch {}
  }, []);

  const t = translations[lang] || translations.en;

  return { lang, setLang, t };
}