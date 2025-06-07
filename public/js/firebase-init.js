import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';
import 'firebase/analytics';
import firebaseConfig from './firebase-config';

let app;
try {
  app = firebase.initializeApp(firebaseConfig);
  firebase.analytics();
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
export const analytics = firebase.analytics();

export default app;