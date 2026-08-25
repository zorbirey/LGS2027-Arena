(()=>{
  'use strict';
  const VERSION='ARENA-AUTH-BRIDGE-V1',BUNDLE_VERSION='ARENA-EDU-CORE-3.5.0';
  const SDK=/^12\.\d+\.\d+$/,APP=/^[a-z0-9-]{3,48}$/;
  const forbidden=/password|refreshToken|privateKey|clientSecret|serviceAccount/i;
  const firebaseFields=['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId'];
  function assertConfig(config){
    if(config?.enabled!==true)return true;
    if(config?.provider!=='firebase')throw new Error('firebase_provider_required');
    if(!APP.test(config?.appId||''))throw new Error('invalid_app_id');
    if(!SDK.test(config?.sdkVersion||''))throw new Error('unsupported_firebase_sdk');
    for(const field of firebaseFields)if(!String(config?.firebase?.[field]||'').trim())throw new Error(`firebase_${field}_required`);
    if(forbidden.test(JSON.stringify(config)))throw new Error('auth_secret_in_public_config');
    if(config.localStorageSessionAllowed!==false)throw new Error('local_storage_session_forbidden');
    return true;
  }
  function safeSnapshot(storage,namespace){
    if(!storage||!String(namespace||'').trim())throw new Error('storage_namespace_required');
    const prefix=`${namespace}:`,data={};
    for(let i=0;i<storage.length;i++){
      const key=storage.key(i);
      if(!key||!key.startsWith(prefix)||/(session|token|membership|entitlement|receipt|secret|password)/i.test(key))continue;
      data[key]=storage.getItem(key);
    }
    return Object.freeze({namespace,entries:Object.freeze(data),overwriteLocalStorage:false});
  }
  async function sha256(value){
    const bytes=new TextEncoder().encode(typeof value==='string'?value:JSON.stringify(value));
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  }
  function createBridge(config){
    assertConfig(config);
    let modules=null,auth=null,current=null;
    const listeners=new Set();
    async function init(){
      if(config.enabled!==true)return null;
      if(auth)return auth;
      const base=`https://www.gstatic.com/firebasejs/${config.sdkVersion}`;
      const [appSdk,authSdk]=await Promise.all([import(`${base}/firebase-app.js`),import(`${base}/firebase-auth.js`)]);
      const app=appSdk.getApps().length?appSdk.getApp():appSdk.initializeApp(config.firebase);
      auth=authSdk.getAuth(app);
      await authSdk.setPersistence(auth,authSdk.browserSessionPersistence);
      modules=authSdk;
      authSdk.onAuthStateChanged(auth,user=>{current=user;for(const listener of listeners)listener(publicUser(user))});
      return auth;
    }
    const publicUser=user=>user?Object.freeze({subject:`firebase:${user.uid}`,emailVerified:user.emailVerified===true,displayName:user.displayName||'',role:'student'}):null;
    async function signUp({email,password,displayName}={}){
      await init();const result=await modules.createUserWithEmailAndPassword(auth,email,password);
      if(displayName)await modules.updateProfile(result.user,{displayName:String(displayName).slice(0,80)});
      await modules.sendEmailVerification(result.user);return Object.freeze({created:true,verificationSent:true,user:publicUser(result.user)});
    }
    async function signIn({email,password}={}){
      await init();const result=await modules.signInWithEmailAndPassword(auth,email,password);
      await result.user.reload();
      if(result.user.emailVerified!==true){await modules.signOut(auth);throw new Error('email_verification_required')}
      return publicUser(result.user);
    }
    async function signOut(){await init();await modules.signOut(auth)}
    async function sendPasswordReset(email){await init();await modules.sendPasswordResetEmail(auth,email);return true}
    async function idToken(forceRefresh=false){await init();if(!auth.currentUser)throw new Error('authentication_required');return auth.currentUser.getIdToken(forceRefresh)}
    async function authorizedFetch(url,options={}){
      const token=await idToken();const headers=new Headers(options.headers||{});headers.set('authorization',`Bearer ${token}`);headers.set('x-arena-app',config.appId);return fetch(url,{...options,headers});
    }
    async function migrationClaim({storage=localStorage,namespace,deviceSubject,consent}={}){
      if(consent!==true)throw new Error('explicit_consent_required');
      const snapshot=safeSnapshot(storage,namespace),account=publicUser(current||auth?.currentUser);if(!account)throw new Error('authentication_required');
      const digest=await sha256(snapshot);
      return Object.freeze({snapshot,claim:window.ArenaIdentityCoreV1.createMigrationClaim({appId:config.appId,deviceSubject,accountSubject:account.subject,backupDigest:digest,consent:true})});
    }
    function onChange(listener){listeners.add(listener);return()=>listeners.delete(listener)}
    return Object.freeze({VERSION,BUNDLE_VERSION,init,signUp,signIn,signOut,sendPasswordReset,idToken,authorizedFetch,migrationClaim,onChange,currentUser:()=>publicUser(current||auth?.currentUser)});
  }
  const api=Object.freeze({VERSION,BUNDLE_VERSION,assertConfig,safeSnapshot,sha256,createBridge,tokenStorage:'session',localStorageSessionAllowed:false});
  if(typeof window!=='undefined')Object.defineProperty(window,'ArenaAuthBridgeV1',{value:api,configurable:false,writable:false});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
