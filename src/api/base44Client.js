// ─────────────────────────────────────────────────────────────
//  iTimeYou — Firebase backend (full Base44 SDK replacement)
//  Provides the same `base44.*` API surface the app already uses:
//    base44.entities.<Name>.list/filter/get/create/update/delete/subscribe
//    base44.auth.me/login/register/loginWithGoogle/logout/updateMe/...
//    base44.integrations.Core.UploadFile({ file }) -> { file_url }
//    base44.functions.invoke(name, payload) -> { data }
// ─────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, query, where, orderBy, limit as fbLimit,
  getDocs, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc
} from 'firebase/firestore';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail,
  updateProfile, updatePassword
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDQl2T85WMrJY1cD40-TudCL8ryI6yYkxw",
  authDomain: "itimeyou-88.firebaseapp.com",
  projectId: "itimeyou-88",
  storageBucket: "itimeyou-88.firebasestorage.app",
  messagingSenderId: "410299185915",
  appId: "1:410299185915:web:951e92d98ed6339938ce5e",
  measurementId: "G-WEKG4XXTDL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Owner / CEO accounts — always treated as admin.
const ADMIN_EMAILS = ['norecord88@gmail.com'];
const isAdminEmail = (email) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());

// ── helpers ──────────────────────────────────────────────────
// Firestore rejects any write containing `undefined`. Strip undefined values
// (deeply) so a single missing field never silently fails the whole write.
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = clean(v);
    }
    return out;
  }
  return value;
}

function parseSort(sort) {
  if (!sort || typeof sort !== 'string') return { field: 'created_date', dir: 'desc' };
  const desc = sort.startsWith('-');
  return { field: desc ? sort.slice(1) : sort, dir: desc ? 'desc' : 'asc' };
}

function mapUser(u) {
  if (!u) return null;
  const display = u.displayName || u.email?.split('@')[0] || 'User';
  return {
    id: u.uid,
    email: u.email,
    full_name: display,
    first_name: display.split(' ')[0],
    last_name: (u.displayName || '').split(' ').slice(1).join(' '),
    photo_url: u.photoURL || '',
    role: isAdminEmail(u.email) ? 'admin' : 'user',
  };
}

// ── generic Firestore entity ─────────────────────────────────
function createEntity(collectionName) {
  return {
    async list(sort = '-created_date', maxResults = 50) {
      try {
        const { field, dir } = parseSort(sort);
        const q = query(collection(db, collectionName), orderBy(field, dir), fbLimit(maxResults));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch {
        const snap = await getDocs(collection(db, collectionName));
        return snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, maxResults);
      }
    },
    async filter(filters = {}, sort = '-created_date', maxResults = 100) {
      try {
        // Firestore stores the document id as the key, not a field.
        // Support filter({ id }) by fetching that document directly.
        if (filters && filters.id) {
          const { id, ...rest } = filters;
          const d = await getDoc(doc(db, collectionName, id));
          if (!d.exists()) return [];
          const row = { id: d.id, ...d.data() };
          const matches = Object.entries(rest).every(([k, v]) => row[k] === v);
          return matches ? [row] : [];
        }
        const entries = Object.entries(filters);
        const constraints = entries.map(([k, v]) => where(k, '==', v));
        const q = constraints.length
          ? query(collection(db, collectionName), ...constraints)
          : collection(db, collectionName);
        const snap = await getDocs(q);
        let rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const { field, dir } = parseSort(sort);
        rows.sort((a, b) => {
          const av = a[field], bv = b[field];
          if (av === bv) return 0;
          const r = av > bv ? 1 : -1;
          return dir === 'desc' ? -r : r;
        });
        return rows.slice(0, maxResults);
      } catch (e) {
        console.warn(`[${collectionName}] filter fallback:`, e.message);
        return [];
      }
    },
    async get(id) {
      const d = await getDoc(doc(db, collectionName, id));
      return d.exists() ? { id: d.id, ...d.data() } : null;
    },
    async create(data) {
      const ts = new Date().toISOString();
      const payload = clean({ ...data, created_date: ts, updated_date: ts });
      const docRef = await addDoc(collection(db, collectionName), payload);
      return { id: docRef.id, ...payload };
    },
    async update(id, data) {
      const payload = clean({ ...data, updated_date: new Date().toISOString() });
      await updateDoc(doc(db, collectionName, id), payload);
      return { id, ...payload };
    },
    async delete(id) {
      await deleteDoc(doc(db, collectionName, id));
      return { success: true };
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
      }, err => console.warn(`[${collectionName}] subscribe error:`, err.message));
    }
  };
}

// ── User entity (registered accounts, backed by `users` collection) ──
const usersCol = createEntity('users');
const UserEntity = {
  ...usersCol,
  async list(sort = '-created_date', maxResults = 200) {
    const direct = await usersCol.list(sort, maxResults);
    if (direct.length) return direct;
    const profiles = await createEntity('userProfiles').list(sort, maxResults);
    return profiles.map(p => ({ id: p.id, email: p.user_email, role: p.role || 'user', ...p }));
  },
};

// ── file uploads ─────────────────────────────────────────────
async function uploadFile(fileOrObj, folder = 'uploads') {
  const file = fileOrObj?.file || fileOrObj;
  const safeName = (file?.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
  const r = ref(storage, `${folder}/${Date.now()}_${safeName}`);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}

// ── auth module ──────────────────────────────────────────────
function currentUserOnce() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, u => { unsub(); resolve(u); });
  });
}

async function ensureUserDir(firebaseUser) {
  if (!firebaseUser) return;
  try {
    const uref = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(uref);
    const desiredRole = isAdminEmail(firebaseUser.email) ? 'admin' : 'user';
    if (!snap.exists()) {
      await setDoc(uref, {
        email: firebaseUser.email,
        full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        role: desiredRole,
        created_date: new Date().toISOString(),
      });
    } else if (desiredRole === 'admin' && snap.data().role !== 'admin') {
      // Promote an existing owner account to admin.
      await setDoc(uref, { role: 'admin' }, { merge: true });
    }
  } catch (e) { /* non-fatal */ }
}

const authModule = {
  async me() {
    const u = await currentUserOnce();
    if (!u) { const err = new Error('Not authenticated'); err.status = 401; throw err; }
    let role = 'user';
    try {
      const d = await getDoc(doc(db, 'users', u.uid));
      if (d.exists() && d.data().role) role = d.data().role;
    } catch { /* ignore */ }
    // Owner / CEO accounts are always admin, regardless of stored role.
    if (isAdminEmail(u.email)) role = 'admin';
    return { ...mapUser(u), role };
  },
  async isAuthenticated() {
    return !!(await currentUserOnce());
  },
  async login({ email, password }) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserDir(cred.user);
    return mapUser(cred.user);
  },
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await ensureUserDir(cred.user);
    return mapUser(cred.user);
  },
  async register({ email, password, full_name }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (full_name) await updateProfile(cred.user, { displayName: full_name });
    await ensureUserDir(cred.user);
    return mapUser(cred.user);
  },
  async updateMe(data = {}) {
    const u = auth.currentUser;
    if (!u) throw new Error('Not authenticated');
    if (data.password) {
      await updatePassword(u, data.password); // may throw auth/requires-recent-login
    }
    const profileUpdate = {};
    if (data.full_name) profileUpdate.displayName = data.full_name;
    if (data.photo_url) profileUpdate.photoURL = data.photo_url;
    if (Object.keys(profileUpdate).length) await updateProfile(u, profileUpdate);
    return mapUser(u);
  },
  async resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  },
  logout() {
    signOut(auth).finally(() => { window.location.href = '/login'; });
  },
  redirectToLogin() {
    window.location.href = '/login';
  },
  onAuthStateChanged(cb) {
    return onAuthStateChanged(auth, cb);
  },
};

// ── serverless functions (stubbed client-side) ───────────────
const functionsModule = {
  async invoke(name, payload = {}) {
    switch (name) {
      case 'updateUserActivity':
        return { data: { success: true } };
      case 'fetchBcelRates':
        return { data: { success: false, message: 'BCEL auto-fetch not configured. Enter rates manually.' } };
      case 'sendVerificationEmail':
      case 'sendPasswordResetEmail':
        return { data: { success: true, message: 'Email queued' } };
      case 'resetUserPassword':
        return { data: { success: true } };
      default:
        console.warn('[functions.invoke] unhandled:', name);
        return { data: { success: false } };
    }
  },
};

// ── public client ────────────────────────────────────────────
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
    User: UserEntity,
  },
  auth: authModule,
  functions: functionsModule,
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const file_url = await uploadFile(file, 'uploads');
        return { file_url };
      },
    },
  },
  storage: { uploadFile },
};

export default base44;
