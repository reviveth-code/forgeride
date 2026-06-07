import { auth } from '@/lib/firebase';
import { RecaptchaVerifier } from 'firebase/auth';

let verifierInstance = null;

export function getRecaptchaVerifier() {
  if (!verifierInstance) {
    verifierInstance = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        verifierInstance = null;
      },
    });
  }
  return verifierInstance;
}

export function clearRecaptchaVerifier() {
  if (verifierInstance) {
    try { verifierInstance.clear(); } catch {}
    verifierInstance = null;
  }
}