import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '@/config/firebase';
import logger from '@/utils/logger';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  location: string;
  profileComplete?: boolean;
  termsAccepted?: boolean;
  termsAcceptedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

class AuthService {
  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, fullName: string): Promise<User> {
    try {
      logger.info('🔐 Creating new user account', { email });
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: fullName
      });

      // Create user profile in Firestore (incomplete profile)
      await this.createUserProfile(user.uid, {
        uid: user.uid,
        email: email,
        name: fullName,
        location: '', // Will be set in profile setup
        profileComplete: false,
        createdAt: new Date()
      });

      logger.success('✅ User account created', { uid: user.uid });
      return user;
    } catch (error: any) {
      logger.error('❌ Sign up failed', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<User> {
    try {
      logger.info('🔐 Signing in user', { email });
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      logger.success('✅ User signed in', { uid: user.uid });
      return user;
    } catch (error: any) {
      logger.error('❌ Sign in failed', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      logger.info('🔐 Signing in with Google');
      
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      // Check if user profile exists, if not create one
      const profileExists = await this.getUserProfile(user.uid);
      if (!profileExists) {
        await this.createUserProfile(user.uid, {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || 'User',
          location: '',
          profileComplete: false,
          createdAt: new Date()
        });
      }

      logger.success('✅ Google sign in successful', { uid: user.uid });
      return user;
    } catch (error: any) {
      logger.error('❌ Google sign in failed', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with GitHub
   */
  async signInWithGithub(): Promise<User> {
    try {
      logger.info('🔐 Signing in with GitHub');
      
      const userCredential = await signInWithPopup(auth, githubProvider);
      const user = userCredential.user;

      // Check if user profile exists, if not create one
      const profileExists = await this.getUserProfile(user.uid);
      if (!profileExists) {
        await this.createUserProfile(user.uid, {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || 'User',
          location: '',
          profileComplete: false,
          createdAt: new Date()
        });
      }

      logger.success('✅ GitHub sign in successful', { uid: user.uid });
      return user;
    } catch (error: any) {
      logger.error('❌ GitHub sign in failed', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      logger.info('🔐 Signing out user');
      await signOut(auth);
      logger.success('✅ User signed out');
    } catch (error: any) {
      logger.error('❌ Sign out failed', error);
      throw error;
    }
  }

  /**
   * Create user profile in Firestore
   */
  private async createUserProfile(uid: string, profile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), profile);
      logger.success('✅ User profile created', { uid });
    } catch (error: any) {
      logger.error('❌ Failed to create user profile', error);
      throw error;
    }
  }

  /**
   * Get user profile from Firestore
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error: any) {
      logger.error('❌ Failed to get user profile', error);
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Handle Firebase auth errors
   */
  private handleAuthError(error: any): Error {
    const errorCode = error.code;
    let message = 'Authentication failed';

    switch (errorCode) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/operation-not-allowed':
        message = 'Operation not allowed';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign in popup was closed';
        break;
      case 'auth/cancelled-popup-request':
        message = 'Sign in was cancelled';
        break;
      default:
        message = error.message || 'Authentication failed';
    }

    return new Error(message);
  }

  /**
   * Accept terms and conditions
   */
  async acceptTerms(userId: string): Promise<void> {
    try {
      logger.info('📝 Accepting terms', { userId });
      
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });
      
      logger.success('✅ Terms accepted');
    } catch (error: any) {
      logger.error('❌ Failed to accept terms', error);
      throw new Error(`Failed to accept terms: ${error.message}`);
    }
  }
}

export default new AuthService();
