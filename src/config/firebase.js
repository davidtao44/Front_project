// Configuración de Firebase para el frontend
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


// Configuración de Firebase
// NOTA: Estos valores deben ser reemplazados con los valores reales de tu proyecto Firebase
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_API_KEY);

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firebase Auth
export const auth = getAuth(app);

// Configurar el proveedor de Google
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Inicializar Firestore
export const db = getFirestore(app);

export default app;