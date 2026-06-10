// src/utils/useReferralCode.ts
import { useEffect } from 'react';
import { Platform, Linking, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';

// Use NativeModules to call Android's Install Referrer directly
const InstallReferrerModule = NativeModules.InstallReferrer;

const REF_STORAGE_KEY = 'referralCode';

const saveCode = async (code: string) => {
  if (!code) {
    console.log('[Referral] ❌ saveCode: Code is empty, skipping save');
    return;
  }
  try {
    const existing = await AsyncStorage.getItem(REF_STORAGE_KEY);
    if (!existing) {
      const upperCode = code.toUpperCase();
      await AsyncStorage.setItem(REF_STORAGE_KEY, upperCode);
      console.log('[Referral] ✅ Saved code:', upperCode);
      console.log('[Referral] 📊 AsyncStorage updated with key:', REF_STORAGE_KEY);
    } else {
      console.log('[Referral] ⏭️ Code already exists in storage:', existing);
    }
  } catch (err) {
    console.log('[Referral] ❌ Error saving code:', err);
  }
};

/**
 * Reads clipboard for referral code.
 * Returns `true` if a valid referral code was found and saved, `false` otherwise.
 */
const readClipboard = async (): Promise<boolean> => {
  try {
    console.log('[Referral] 📋 Checking clipboard for referral code...');
    if (!Clipboard || !Clipboard.getString) {
      console.log('[Referral] 📋 Clipboard module NOT available or getString missing');
      return false;
    }

    if (Platform.OS === 'ios') {
      // iOS 16+: Silent clipboard reads are blocked.
      // Use hasString() first — this does NOT trigger the paste banner.
      console.warn('[Referral] 📋 iOS: Checking hasString() first...');
      
      let hasStr = false;
      try {
        hasStr = await Clipboard.hasString();
      } catch (e) {
        console.warn('[Referral] 📋 iOS: hasString() error:', e);
      }
      console.warn('[Referral] 📋 iOS: hasString result:', hasStr);

      if (!hasStr) {
        console.warn('[Referral] 📋 iOS: No string in clipboard, skipping');
        return false;
      }

      // Automatically read and apply the referral code without prompting
      try {
        console.warn('[Referral] 📋 iOS: Auto-reading clipboard...');
        const text = await Clipboard.getString();
        console.warn('[Referral] 📋 iOS: Clipboard content:', text);
        if (text && text.startsWith('REF:')) {
          const code = text.replace('REF:', '').trim();
          if (code.length > 0) {
            console.log('copiedcode', code);
            console.log('[Referral] 📋 ✅ iOS: Clipboard referral code FOUND & SAVED:', code);
            await saveCode(code);
            Clipboard.setString('');
            console.warn('[Referral] 📋 iOS: Clipboard cleared after saving code');
            return true;
          }
        } else {
          console.warn('[Referral] 📋 iOS: No REF: prefix found in clipboard text:', text);
        }
      } catch (err) {
        console.warn('[Referral] 📋 iOS: Clipboard read error:', err);
      }
      return false;
    } else {
      // Android: Silent clipboard reads work fine
      console.log('[Referral] 📋 Android: About to read clipboard...');
      let text = '';
      try {
        text = await Clipboard.getString();
      } catch (clipErr) {
        console.log('[Referral] 📋 ❌ Android: Clipboard.getString() FAILED:', clipErr);
        return false;
      }
      console.log('[Referral] 📋 Android: Clipboard content:', JSON.stringify(text));
      console.log('[Referral] 📋 Android: Clipboard text length:', text ? text.length : 0);
      console.log('[Referral] 📋 Android: Starts with REF:', text ? text.startsWith('REF:') : false);
      if (text && text.startsWith('REF:')) {
        const code = text.replace('REF:', '').trim();
        console.log('[Referral] 📋 Android: Extracted code:', code);
        if (code.length > 0) {
          console.log('copiedcode', code);
          console.log('[Referral] 📋 ✅ Android: Clipboard referral code FOUND & SAVED:', code);
          await saveCode(code);
          Clipboard.setString('');
          console.log('[Referral] 📋 Android: Clipboard cleared after saving code');
          return true;
        }
      } else {
        console.log('[Referral] 📋 Android: No REF: prefix found in clipboard. Content was:', JSON.stringify(text));
      }
    }
  } catch (err) {
    console.log('[Referral] 📋 ❌ Clipboard read error:', err);
  }
  return false;
};

const readDeepLink = async () => {
  const url = await Linking.getInitialURL();
  console.log('[Referral] 🔗 Initial URL from Linking:', url);
  if (!url) {
    console.log('[Referral] 🔗 No deep link URL found');
    return;
  }

  console.log('[Referral] 🔗 Parsing deep link URL:', url);

  try {
    const parsed = new URL(url);
    console.log('[Referral] 🔗 Parsed hostname:', parsed.hostname);
    console.log('[Referral] 🔗 Parsed pathname:', parsed.pathname);
    console.log('[Referral] 🔗 Parsed search:', parsed.search);

    let code: string | null = null;

    // 1️⃣ Play Store URL: extract utm_content from the encoded referrer param
    //    e.g. ?referrer=utm_source%3Dreferral%26utm_content%3DNJG720Z1
    const referrerParam = parsed.searchParams.get('referrer');
    if (referrerParam) {
      console.log('[Referral] 🔗 Found referrer param (Play Store URL):', referrerParam);
      const decodedReferrer = decodeURIComponent(referrerParam);
      console.log('[Referral] 🔗 Decoded referrer:', decodedReferrer);
      const referrerParams = new URLSearchParams(decodedReferrer);
      code = referrerParams.get('utm_content') || null;
      console.log('[Referral] 🔗 utm_content from referrer:', code);
    }

    // 2️⃣ Direct query params: ?ref=CODE or ?code=CODE
    if (!code) {
      code = parsed.searchParams.get('ref') || parsed.searchParams.get('code');
      console.log('[Referral] 🔗 Query param code:', code);
    }

    // 3️⃣ Fallback: last path segment (e.g. /ref/NJG720Z1)
    if (!code) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      const lastSegment = parts[parts.length - 1];
      // Avoid picking up generic paths like "details" or app package names
      if (lastSegment && !lastSegment.includes('.') && lastSegment !== 'details') {
        code = lastSegment;
        console.log('[Referral] 🔗 Path segment extracted:', code);
      }
    }

    if (code) {
      console.log('[Referral] 🔗 ✅ Found deep link code:', code);
      await saveCode(code);
    } else {
      console.log('[Referral] 🔗 ❌ No code found in deep link');
    }
  } catch (err) {
    console.log('[Referral] 🔗 Deep link parse error:', err);
  }
};

const readInstallReferrer = async () => {
  if (Platform.OS !== 'android') {
    console.log('[Referral] 📲 Install Referrer: Not Android, skipping');
    return;
  }
  
  if (!InstallReferrerModule) {
    console.log('[Referral] 📲 Install Referrer module NOT available - trying fallback...');
    return;
  }

  try {
    console.log('[Referral] 📲 Reading Install Referrer via NativeModules...');
    const refString = await InstallReferrerModule.getInstallReferrer();
    console.log('[Referral] 📲 Referrer string:', refString);
    
    if (!refString) {
      console.log('[Referral] 📲 ❌ No referrer string found');
      return;
    }

    console.log('[Referral] 📲 Decoding referrer string...');
    const decoded = decodeURIComponent(refString);
    console.log('[Referral] 📲 Decoded:', decoded);
    
    const params = new URLSearchParams(decoded);
    console.log('[Referral] 📲 Params keys:', Array.from(params.keys()));

    // 1️⃣ industry standard
    let code = params.get('utm_content');
    console.log('[Referral] 📲 utm_content code:', code);
    
    // 2️⃣ fallback for older links
    if (!code) {
      code = params.get('referrer');
      console.log('[Referral] 📲 fallback referrer code:', code);
    }

    if (code) {
      console.log('[Referral] 📲 ✅ Found Install Referrer code:', code);
      await saveCode(code);
    } else {
      console.log('[Referral] 📲 ❌ No referral code found in Install Referrer');
    }
  } catch (err) {
    console.log('[Referral] 📲 Install Referrer error:', err);
  }
};

/**
 * Get stored referral code from AsyncStorage
 */
export async function getStoredReferralCode(): Promise<string | null> {
  try {
    console.log('[Referral] 💾 Getting stored code from AsyncStorage...');
    const code = await AsyncStorage.getItem(REF_STORAGE_KEY);
    console.log('[Referral] 💾 Retrieved code:', code);
    return code;
  } catch (err) {
    console.log('[Referral] 💾 Error getting code:', err);
    return null;
  }
}

/**
 * Clear stored referral code (call after successful registration)
 */
export async function clearStoredReferralCode(): Promise<void> {
  try {
    console.log('[Referral] 🗑️ Clearing stored referral code...');
    await AsyncStorage.removeItem(REF_STORAGE_KEY);
    console.log('[Referral] 🗑️ Code cleared successfully');
  } catch (err) {
    console.log('[Referral] 🗑️ Error clearing code:', err);
  }
}

export const useReferralCode = () => {
  useEffect(() => {
    const init = async () => {
      console.log('[Referral] 🚀 ===== REFERRAL CODE HOOK INITIALIZED =====');
      console.log('[Referral] 🚀 Platform:', Platform.OS);
      console.log('[Referral] 🚀 Storage Key:', REF_STORAGE_KEY);
      
      // 1️⃣ ALWAYS check clipboard FIRST on both platforms
      console.log('[Referral] 🚀 Step 1: Checking clipboard FIRST...');
      const foundInClipboard = await readClipboard();

      if (foundInClipboard) {
        console.log('[Referral] 🚀 ✅ Referral code found in clipboard — skipping other methods');
        console.log('[Referral] 🚀 ===== REFERRAL CODE HOOK COMPLETED (via clipboard) =====');
        return;
      }

      // 2️⃣ Clipboard didn't have a code — try other methods as fallback
      console.log('[Referral] 🚀 Clipboard had no referral code, trying fallback methods...');
      
      if (Platform.OS === 'android') {
        console.log('[Referral] 🚀 Step 2: Trying Install Referrer...');
        await readInstallReferrer();
        console.log('[Referral] 🚀 Step 3: Trying Deep Link...');
        await readDeepLink();
      } else {
        console.log('[Referral] 🚀 Step 2: Trying Deep Link...');
        await readDeepLink();
      }
      
      console.log('[Referral] 🚀 ===== REFERRAL CODE HOOK COMPLETED =====');
    };
    init();

    // Listen for deep links while app is already running (warm start)
    const handleDeepLink = async (event: { url: string }) => {
      console.log('[Referral] 🔗 ===== DEEP LINK RECEIVED (app already open) =====');
      console.log('[Referral] 🔗 URL:', event.url);
      if (!event.url) return;

      try {
        const parsed = new URL(event.url);
        let code: string | null = null;

        // 1️⃣ Play Store URL: ?referrer=utm_source%3Dreferral%26utm_content%3DCODE
        const referrerParam = parsed.searchParams.get('referrer');
        if (referrerParam) {
          const decoded = decodeURIComponent(referrerParam);
          const rp = new URLSearchParams(decoded);
          code = rp.get('utm_content') || null;
          console.log('[Referral] 🔗 Play Store utm_content (warm):', code);
        }

        // 2️⃣ Direct query params: ?ref=CODE or ?code=CODE
        if (!code) {
          code = parsed.searchParams.get('ref') || parsed.searchParams.get('code');
        }

        // 3️⃣ Path segment: /ref/CODE
        if (!code) {
          const parts = parsed.pathname.split('/').filter(Boolean);
          const lastSegment = parts[parts.length - 1];
          if (lastSegment && !lastSegment.includes('.') && lastSegment !== 'details') {
            code = lastSegment;
          }
        }

        if (code) {
          console.log('[Referral] 🔗 ✅ Found deep link code (warm):', code);
          await saveCode(code);
        }
      } catch (err) {
        console.log('[Referral] 🔗 Deep link parse error (warm):', err);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);
};