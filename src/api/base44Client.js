import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, query, where, orderBy, limit,
  getDocs, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc
} from 'firebase/firestore';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBctt9A4ErSCw_uX0ddU7qbT0uWNZv9lRY",
  authDomain: "itimeyou-88.firebaseapp.com",
  projectId: "itimeyou-88",
  storageBucket: "itimeyou-88.firebasestorage.app",
  messagingSenderId: "410299185915",
  appId: "1:410299185915:web:56a91d5d6f9d535638ce5e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

function parseSort(sort) {
  if (!sort) return { field: 'created_date', dir: 'desc' };
  const desc = sort.startsWith('-');
  return { field: desc ? sort.slice(1) : sort, dir: desc ? 'desc' : 'asc' };
}

function createEntity(collectionName) {
  return {
    async list(sort = '-created_date', maxResults = 50) {
      try {
        const { field, dir } = parseSort(sort);
        const q = query(collection(db, collectionName), orderBy(field, dir), limit(maxResults));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch {
        // Fallback without index
        const snap = await getDocs(collection(db, collectionName));
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return docs.slice(0, maxResults);
      }
    },
    async filter(filters) {
      try {
        let q = collection(db, collectionName);
        const entries = Object.entries(filters);
        if (entries.length > 0) {
          const constraints = entries.map(([k, v]) => where(k, '==', v));
          q = query(q, ...constraints);
        }
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch { return []; }
    },
    async get(id) {
      const d = await getDoc(doc(db, collectionName, id));
      return d.exists() ? { id: d.id, ...d.data() } : null;
    },
    async create(data) {
      const ts = new Date().toISOString();
      const clean = { ...data, created_date: ts, updated_date: ts };
      const docRef = await addDoc(collection(db, collectionName), clean);
      return { id: docRef.id, ...clean };
    },
    async update(id, data) {
      await updateDoc(doc(db, collectionName, id), { ...data, updated_date: new Date().toISOString() });
    },
    async delete(id) {
      await deleteDoc(doc(db, collectionName, id));
    },
    subscribe(callback) {
      let ready = false;
      return onSnapshot(collection(db, collectionName), snap => {
        if (!ready) { ready = true; return; }
        snap.docChanges().forEach(change => {
          const data = { id: change.doc.id, ...change.doc.data() };
          if (change.type === 'added') callback({ type: 'create', data });
          else if (change.type === 'modified') callback({ type: 'update', id: change.doc.id, data });
          else if (change.type === 'removed') callback({ type: 'delete', id: change.doc.id });
        });
      });
    }
  };
}

export async function uploadFile(file, folder = 'uploads') {
  const r = ref(storage, `${folder}/${Date.now()}_${file.name}`);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}

const authModule = {
  async me() {
    return new Promise((resolve, reject) => {
      const unsub = onAuthStateChanged(auth, user => {
        unsub();
        if (user) {
          resolve({
            id: user.uid,
            email: user.email,
            full_name: user.displayName || user.email?.split('@')[0] || 'User',
            first_name: user.displayName?.split(' ')[0] || 'User',
            last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
            photo_url: user.photoURL || '',
          });
        } else {
          reject({ status: 401, message: 'Not authenticated' });
        }
      });
    });
  },
  async login({ email, password }) {
    return signInWithEmailAndPassword(auth, email, password);
  },
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  },
  async register({ email, password, full_name }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (full_name) await updateProfile(cred.user, { displayName: full_name });
    return cred.user;
  },
  async resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  },
  logout() {
    signOut(auth).then(() => { window.location.href = '/login'; });
  },
  redirectToLogin() {
    window.location.href = '/login';
  },
  onAuthStateChanged(cb) {
    return onAuthStateChanged(auth, cb);
  }
};

export const base44 = {
  entities: {
    Post: createEntity('posts'),
    Listing: createEntity('listings'),
    Booking: createEntity('bookings'),
    ServiceBooking: createEntity('serviceBookings'),
    Message: createEntity('messages'),
    Conversation: createEntity('conversations'),
    UserProfile: createEntity('userProfiles'),
    Review: createEntity('reviews'),
    Notification: createEntity('notifications'),
    WalletTransaction: createEntity('walletTransactions'),
    WalletAccountSettings: createEntity('walletAccountSettings'),
    ExchangeRateSettings: createEntity('exchangeRateSettings'),
    Comment: createEntity('comments'),
    PasswordReset: createEntity('passwordResets'),
  },
  auth: authModule,
  storage: { uploadFile },
};
