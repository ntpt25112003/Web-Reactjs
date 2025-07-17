import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  limitToLast,
  query,
  get,
  orderByKey,
  onChildAdded,
  update,
  equalTo,
  orderByChild,
  startAfter,
  ThenableReference,
} from 'firebase/database';

import configService from './configService';
import storageService, { StorageKey } from './storageService';
import appService from './appService';

class FirebaseService {
  private h_debug = false;

  private m_auth: ReturnType<typeof getAuth> | null = null;
  private m_db: ReturnType<typeof getDatabase> | null = null;

  private m_user: any = null;

  public init() {
    const log: any = {};
    try {
      const app = initializeApp(configService.FIREBASE_CONFIG);
      log.app = app;

      // Khởi tạo Authentication
      this.m_auth = appService.isNativePlatform()
        ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
        : getAuth(app);
      log.m_auth = this.m_auth;

      // Khởi tạo Realtime Database
      this.m_db = getDatabase(app);
      log.m_db = this.m_db;
    } catch (e: any) {
      log.error = e;
    } finally {
      appService.log('[firebase.service] init', log, this.h_debug);
    }
  }

  public async loadCache() {
    this.m_user = await storageService.get(StorageKey.FB_USER, 'object');
    appService.log('[firebase.service] loadCache', { m_user: this.m_user }, this.h_debug);
  }

  public async cleanCache() {
    await storageService.remove(StorageKey.FB_USER);
  }

  // Authentication
  public async registerAccount(email: string): Promise<UserCredential> {
    const log: any = { email };
    try {
      if (!this.m_auth) throw new Error('Firebase Auth not initialized');
      this.m_user = await createUserWithEmailAndPassword(this.m_auth, email, configService.FIREBASE_PASSWORD);
      log.m_user = this.m_user;
      return this.m_user;
    } catch (e: any) {
      log.error = e;
      if (e.code === 'auth/configuration-not-found')
        throw { error: true, msg: 'Chưa cấu hình Authentication cho Firebase!' };
      throw e;
    } finally {
      appService.log('[firebase.service] registerAccount', log, this.h_debug);
    }
  }

  public async login(email: string): Promise<UserCredential> {
    const log: any = { email };
    try {
      if (!this.m_auth) throw new Error('Firebase Auth not initialized');
      this.m_user = await signInWithEmailAndPassword(this.m_auth, email, configService.FIREBASE_PASSWORD);
      log.m_user = this.m_user;

      await storageService.set(StorageKey.FB_USER, this.m_user);
      return this.m_user;
    } catch (e: any) {
      log.error = e;
      throw { error: true, msg: 'Tài khoản chưa đăng ký firebase' };
    } finally {
      appService.log('[firebase.service] login', log, this.h_debug);
    }
  }

  public async logout() {
    const log: any = {};
    try {
      if (!this.m_auth || !this.m_auth.currentUser) return;
      await signOut(this.m_auth);
      log.m_auth = this.m_auth;
      this.m_user = null;
    } catch (e: any) {
      log.error = e;
      throw e;
    } finally {
      appService.log('[firebase.service] logout', log, this.h_debug);
    }
  }

  // Realtime Database helpers
  private fbRead(refInstance: any): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        onValue(
          refInstance,
          (snapshot) => {
            if (snapshot.exists()) {
              const val = snapshot.val();
              appService.log('[firebase.service] fbRead', { val }, this.h_debug);
              resolve(val);
            } else {
              appService.log('[firebase.service] fbRead', { warning: 'No data available' }, this.h_debug);
              resolve(null);
            }
          },
          (err: Error) => {
            appService.log('[firebase.service] fbRead', { error: err }, this.h_debug);
            reject(err);
          }
        );
      } catch (e: any) {
        appService.log('[firebase.service] fbRead', { error: e }, this.h_debug);
        reject(e);
      }
    });
  }

  public async checkExist(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.m_db) reject('Realtime Database not initialized');
        const mRef = ref(this.m_db!, path);
        if (mRef) {
          onValue(mRef, (snapshot) => resolve(snapshot.exists()));
        } else {
          reject(`path: ${path} is null reference`);
        }
      } catch (e: any) {
        reject(e);
      }
    });
  }

  public async read(path: string): Promise<any> {
    if (!this.m_db) throw new Error('Realtime Database not initialized');
    return this.fbRead(ref(this.m_db, path));
  }

  public async readPaging(path: string, limit: number, offset?: string) {
    if (!this.m_db) throw new Error('Realtime Database not initialized');
    if (!offset) {
      return this.fbRead(query(ref(this.m_db, path), limitToLast(limit)));
    }
    // TODO: implement offset paging if needed
  }

  public async write(path: string, data: any) {
    if (!this.m_db) throw new Error('Realtime Database not initialized');
    await set(ref(this.m_db, path), data);
  }

  public async update(path: string, data: any) {
    if (!this.m_db) throw new Error('Realtime Database not initialized');
    await update(ref(this.m_db, path), data);
  }

  public async push(path: string, data: any): Promise<string> {
    if (!this.m_db) throw new Error('Realtime Database not initialized');
    const dtRef: ThenableReference = push(ref(this.m_db, path));
    await set(dtRef, data);
    return dtRef.key || '';
  }

  public async newKey(path: string): Promise<string> {
    if (!this.m_db) throw new Error('Realtime Database not initialized');
    return push(ref(this.m_db, path)).key || '';
  }

  public async getLast(path: string, limit = 1): Promise<any> {
    if (!this.m_db) throw new Error('Realtime Database not initialized');
    const snapshot = await get(query(ref(this.m_db, path), orderByKey(), limitToLast(limit)));
    return snapshot.val();
  }

  public async newLength(path: string): Promise<number> {
    const lastNode = await this.getLast(path);
    if (!lastNode) return 0;
    for (const key in lastNode) {
      return parseInt(key) + 1;
    }
    return 0;
  }

  public async findProperty(path: string, propName: string, propValue: any): Promise<any> {
    const log: any = { path, propName, propValue };
    try {
      if (!this.m_db) throw new Error('Realtime Database not initialized');
      const fbRef = ref(this.m_db, path);
      const fbQuery = query(fbRef, orderByChild(propName), equalTo(propValue));
      const fbSnapshot = await get(fbQuery);
      const lstRes = fbSnapshot.val();
      log.lstRes = lstRes;
      return lstRes;
    } catch (e: any) {
      log.error = e;
      throw e;
    } finally {
      appService.log('[firebase.service] findProperty', log, this.h_debug);
    }
  }

  // Realtime Database - Event
  public registerOnChildAdded(path: string, func: any, fromKey?: string) {
    if (!func) return null;
    if (!this.m_db) throw new Error('Realtime Database not initialized');

    const fbRef = ref(this.m_db, path);
    if (fromKey) {
      const fbQuery = query(fbRef, orderByKey(), startAfter(fromKey));
      return onChildAdded(fbQuery, func);
    } else {
      return onChildAdded(fbRef, func);
    }
  }

  // Special for chat or custom query
  public async getListContainChildCond(path: string, childPath: string, funcCond: (lstChild: any) => boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.m_db) return reject('Realtime Database not initialized');
        const fbRef = ref(this.m_db, path);
        onValue(
          fbRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const lstRes: any[] = [];
              snapshot.forEach((childSnapshot) => {
                const lstChild = childSnapshot.child(childPath).val();
                if (funcCond(lstChild)) {
                  const data = childSnapshot.val();
                  data.key = childSnapshot.key;
                  lstRes.push(data);
                }
              });
              resolve(lstRes);
            } else {
              resolve([]);
            }
          },
          (err: Error) => {
            appService.log('[firebase.service] getListContainChildCond', { error: err }, this.h_debug);
            reject(err);
          }
        );
      } catch (e: any) {
        appService.log('[firebase.service] getListContainChildCond', { error: e }, this.h_debug);
        reject(e);
      }
    });
  }

  // Getters
  public getUser() {
    return this.m_user;
  }

  public getUserKey() {
    return this.m_user?.user?.uid || '';
  }
}

const firebaseService = new FirebaseService();
export default firebaseService;
