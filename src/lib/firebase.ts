import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

function resolveAuthDomain(): string {
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    const host = window.location.hostname.toLowerCase();
    if (host.endsWith(".run.app") || host.endsWith(".ai.studio")) {
      return window.location.host;
    }
  }
  return firebaseConfig.authDomain;
}

const app = initializeApp({
  ...firebaseConfig,
  authDomain: resolveAuthDomain(),
});
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope("email");
googleAuthProvider.addScope("profile");
googleAuthProvider.setCustomParameters({ prompt: "select_account" });
