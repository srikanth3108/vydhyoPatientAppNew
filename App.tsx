import React, { useEffect, useState, useRef } from 'react';
import { Provider, useSelector } from 'react-redux';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Platform, Animated, Dimensions, PermissionsAndroid, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import Routing from './src/navigation/routing';
import store from './src/store/store';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthPost } from './src/services';
import DeviceInfo from 'react-native-device-info';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { useReferralCode } from './src/utils/useReferralCode';

const { width } = Dimensions.get('window');
const FORCE_UPDATE_URL = 'https://server.vydhyo.com/patient/app-version';

const App = () => {
  const [forceUpdate, setForceUpdate] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
// console.log("storeData",storeData)

  // Track last shown notification to prevent duplicates from backend
  const lastNotifRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

   useReferralCode(); // just call once at root



 


  // ============ PUSH NOTIFICATIONS ============

  async function requestUserIOSPermission() {
    try {
      console.log('🍎 [iOS Push] Step 1: Requesting iOS notification permission...');
      const authStatus = await messaging().requestPermission();
      console.log('🍎 [iOS Push] Step 1: authStatus =', authStatus);
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ [iOS Push] Step 1: Permission GRANTED, authStatus:', authStatus);
        syncFcmToken();
      } else {
        console.log('❌ [iOS Push] Step 1: Permission DENIED, authStatus:', authStatus);
      }
    } catch (err: any) {
      console.log('❌ [iOS Push] Step 1: requestPermission CRASHED:', err?.message || err);
    }
  }


  const requestAndroidNotificationPermission = async () => {
    if (Platform.OS !== 'android') {
      return
    }

    try {
      if (Platform.Version >= 33) {
        console.log('🔔 [Push] Step 1: Requesting notification permission (Android 13+)...');
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ [Push] Step 1: Notification permission GRANTED');
        } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
          console.log('❌ [Push] Step 1: Notification permission DENIED');
          Alert.alert(
            'Notifications Disabled',
            'You won\'t receive important updates. You can enable notifications from Settings.',
            [{ text: 'OK' }],
          );
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          console.log('🚫 [Push] Step 1: Notification permission BLOCKED (never ask again)');
          Alert.alert(
            'Notifications Blocked',
            'Notifications are blocked. Please go to App Settings > Notifications to enable them.',
            [{ text: 'OK' }],
          );
        }
      } else {
        console.log('✅ [Push] Step 1: Android < 13, permission auto-granted');
      }
    } catch (err) {
      console.log('❌ [Push] Step 1: Permission request FAILED:', err);
    }
  };

  const syncFcmToken = async () => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      console.log('🔔 [Push] Step 2: Found authToken:', authToken);
      if (!authToken) {
        console.log('⏳ [Push] Step 2: No authToken yet (user not logged in), skipping FCM token sync');
        return;
      }

      console.log('🔔 [Push] Step 2: Getting FCM token from Firebase...');
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log('✅ [Push] Step 2: FCM Token received:', fcmToken);
        console.log('🔔 [Push] Step 2: Sending FCM token to backend...');
        const response = await AuthPost('users/updateFcmToken', { fcmToken }, authToken);
        console.log('✅ [Push] Step 2: Backend response:', JSON.stringify(response));
        
      } else {
        console.log('❌ [Push] Step 2: FCM token is null/empty');
      }
    } catch (err: any) {
      console.log('❌ [Push] Step 2: FCM token sync FAILED:', err?.message || err);
    }
  };

  const setupPushNotifications = () => {
    try {
      console.log('🔔 [Push] Step 3: Registering push notification listeners...');

      // Foreground notification listener
      const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
        console.log('📩 [Push] Foreground notification received:', JSON.stringify(remoteMessage, null, 2));


        const title = remoteMessage.notification?.title || 'Notification';
        const body = remoteMessage.notification?.body || '';

        // Deduplicate: backend sends the same notification twice within milliseconds
        const notifKey = `${title}::${body}`;
        const now = Date.now();
        if (lastNotifRef.current.key === notifKey && now - lastNotifRef.current.time < 5000) {
          console.log('⚠️ Duplicate notification skipped (same content within 5s)');
          return;
        }
        lastNotifRef.current = { key: notifKey, time: now };

        // Create a channel (required for Android 8+)
        const channelId = await notifee.createChannel({
          id: 'vydhyo_default_channel',
          name: 'Vydhyo Notifications',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });

        // Display a real system notification
        await notifee.displayNotification({
          title,
          body,
          android: {
            channelId,
            smallIcon: 'ic_launcher',
            pressAction: { id: 'default' },
            importance: AndroidImportance.HIGH,
          },
        });
      });

      // Token refresh listener — sync new token to backend
      const unsubscribeTokenRefresh = messaging().onTokenRefresh(async newToken => {
        console.log('🔄 [Push] Token refreshed! New token:', newToken.substring(0, 20) + '...');
        try {
          const authToken = await AsyncStorage.getItem('authToken');
          if (authToken) {
            await AuthPost('users/updateFcmToken', { fcmToken: newToken }, authToken);
          }
        } catch (err) {
          // silently fail
        }
      });

      // Notification opened app handler (app was in background)
      const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(_remoteMessage => {
        console.log('📩 [Push] User tapped notification (app was in background):', JSON.stringify(_remoteMessage, null, 2));
      });

      console.log('✅ [Push] Step 3: All 3 listeners registered (foreground, tokenRefresh, notificationOpened)');

      return () => {
        unsubscribeOnMessage();
        unsubscribeTokenRefresh();
        unsubscribeNotificationOpened();
      };
    } catch (err: any) {
      console.log('❌ [Push] Step 3: setupPushNotifications CRASHED:', err?.message || err);
      return () => {};
    }
  };

  // ============ END PUSH NOTIFICATIONS ============

  const checkVersion = async () => {
    try {
      const currentVersion = parseInt(DeviceInfo.getBuildNumber());
      const res = await fetch(FORCE_UPDATE_URL);
      const data = await res.json();
      // console.log('Current Version:', currentVersion);
      // console.log('Version check response:', data);
      // console.log("currentVersion < data.androidMinVersionCode",currentVersion < data.androidMinVersionCode)

      if (Platform.OS === 'ios'){
        const iosMinVersion = data.iosMinVersionCode;
        if (currentVersion < iosMinVersion) {
          setForceUpdate(true);
        }
      } else if (currentVersion < data.androidMinVersionCode) {
        setForceUpdate(true);
      }
    } catch (err) {
      console.log('Version check failed:', err);
    }
  };

  const openStore = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/us/app/vydhyo/id6755134892');
    } else {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.vydhyopatientapp');
    }
  };

  useEffect(() => {
    console.log('🚀 [App] useEffect running, Platform:', Platform.OS);

    checkVersion().catch((err: any) => {
      console.log('Version check error:', err?.message || err);
    });

    // Push Notifications setup
    if (Platform.OS === 'android') {
      console.log('🔔 ====== PUSH NOTIFICATION INIT START (Android) ======');
      requestAndroidNotificationPermission().then(() => {
        syncFcmToken();
      });
    } else {
      console.log('🍎 ====== PUSH NOTIFICATION INIT START (iOS) ======');
      requestUserIOSPermission();
    }

    const cleanupPush = setupPushNotifications();

    return () => {
      if (typeof cleanupPush === 'function') {
        cleanupPush();
      }
    };
  }, []);

  // useEffect(() => {
  //   if (forceUpdate) {
  //       Animated.spring(scaleAnim, {
  //         toValue: 1,
  //         tension: 50,
  //         friction: 7,
  //         useNativeDriver: true,
  //       }).start();

  //       Animated.timing(fadeAnim, {
  //         toValue: 1,
  //       duration: 800,
  //       useNativeDriver: true,
  //     }).start();

  //     Animated.timing(slideAnim, {
  //       toValue: 0,
  //       duration: 600,
  //       useNativeDriver: true,
  //     }).start();

  //     Animated.loop(
  //       Animated.sequence([
  //         Animated.timing(pulseAnim, {
  //           toValue: 1.05,
  //           duration: 1000,
  //           useNativeDriver: true,
  //         }),
  //         Animated.timing(pulseAnim, {
  //           toValue: 1,
  //           duration: 1000,
  //         useNativeDriver: true,
  //       }),
  //     ])
  //     ).start();
  //   }
  // }, [forceUpdate]);

  // console.log('Force update required:', forceUpdate);
  // if (forceUpdate) {
  //   return (
  //     <View style={styles.container}>
  //       {/* subtle gradient bg shapes */}
  //       <View style={styles.gradientTop} />
  //       <View style={styles.gradientBottom} />

  //       {/* floating decor */}
  //       <View style={[styles.floatingCircle, styles.circle1]} />
  //       <View style={[styles.floatingCircle, styles.circle2]} />
  //       <View style={[styles.floatingCircle, styles.circle3]} />

  //       <Animated.View 
  //         style={[
  //           styles.contentContainer,
  //           {
  //             opacity: fadeAnim,
  //             transform: [{ translateY: slideAnim }],
  //           },
  //         ]}
  //       >
  //          <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}> 
  //             <View style={styles.iconCircle}>
  //             <View style={styles.iconInner}>
  //               <Text style={styles.iconText}>🚀</Text>
  //             </View>
  //           </View>
  //           <View style={styles.iconGlow} />
  //         </Animated.View>

  //         <Text style={styles.title}>New Update Available!</Text>

  //           <Text style={styles.subtitle}>
  //             We've crafted something special for you.{'\n'}
  //           Update now to unlock the latest features.
  //           </Text>

  //         <View style={styles.featuresContainer}>
  //           {[
  //             { icon: '⚡', text: 'Lightning-fast performance', color: '#FFD700' },
  //             { icon: '🛡️', text: 'Enhanced security & stability', color: '#4ECDC4' },
  //             { icon: '✨', text: 'Exciting new features', color: '#FF6B9D' },
  //           ].map((feature, index) => (
  //             <View key={index} style={styles.featureCard}>
  //               <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20' }]}>
  //               <Text style={styles.featureIcon}>{feature.icon}</Text>
  //             </View>
  //               <Text style={styles.featureText}>{feature.text}</Text>
  //             </View>
  //           ))}
  //         </View>

  //         <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
  //         <TouchableOpacity style={styles.updateButton} onPress={openStore} activeOpacity={0.8}>
  //           <Text style={styles.buttonText}>Update Now</Text>
  //             <View style={styles.buttonIconContainer}>
  //               <Text style={styles.buttonIcon}>→</Text>
  //             </View>
  //         </TouchableOpacity>
  //         </Animated.View>

  //         <View style={styles.versionContainer}>
  //           <View style={styles.versionDot} />
  //         <Text style={styles.versionText}>This update is required to continue</Text>
  //         </View>
  //       </Animated.View>
  //     </View>
  //   );
  // }



  return (
    <Provider store={store}>
      <View style={styles.appContainer}>
        <Routing />
        <Toast />
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  appContainer: { 
    flex: 1 
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gradientTop: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#6366F1',
    opacity: 0.15,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#EC4899',
    opacity: 0.1,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: '#ffffff',
    opacity: 0.03,
  },
  circle1: {
    width: 200,
    height: 200,
    top: 50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: 100,
    left: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    top: '40%',
    left: 30,
  },
  contentContainer: {
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 30,
    position: 'relative',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#334155',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#6366F1',
    opacity: 0.2,
    top: -10,
    left: -10,
  },
  iconText: {
    fontSize: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '600',
    flex: 1,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
    marginRight: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default App;



// // import {  StyleSheet, Text, useColorScheme, View } from 'react-native';
// // import Routing from './src/Routing/routing';
// // import Toast from 'react-native-toast-message';


// // function App() {
// //   // const isDarkMode = useColorScheme() === 'dark';

// //   return (
// //     <View style={styles.container}>
// //     <Routing/>
// //      <Toast/>
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //   },
// // });

// // export default App;





// import React, { useEffect, useState } from 'react';
// import { Provider } from 'react-redux';
// import { StyleSheet, View, Text, TouchableOpacity, Linking } from 'react-native';
// import Toast from 'react-native-toast-message';
// import Routing from './src/Routing/routing';
// import store from './src/components/store/store'; // adjust the path if needed
// import messaging from '@react-native-firebase/messaging';
// import PushNotification from 'react-native-push-notification';
// import { PermissionsAndroid, Platform } from 'react-native';
// import DeviceInfo from 'react-native-device-info';

// import { AuthPost } from './src/services';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const FORCE_UPDATE_URL = 'https://server.vydhyo.com/patient/app-version';

// const App = () => {
//   const [forceUpdate, setForceUpdate] = useState(false);

//   useEffect(() => {
//     // Ask for permission (iOS)
//     requestUserPermission();

//     // Get FCM token

//     syncFcmToken();
//     checkVersion();

//     // Foreground notification listener
//     const unsubscribeMessage = messaging().onMessage(async remoteMessage => {

//       PushNotification.localNotification({
//         channelId: "default-channel-id", // make sure this channel is created in index.js
//         title: remoteMessage.notification?.title,
//         message: remoteMessage.notification?.body || '',
//       });
//     });


//     // Token refresh listener
//     const unsubscribeRefresh = messaging().onTokenRefresh(async (newToken) => {
//       const authToken = await AsyncStorage.getItem('authToken');
//       if (authToken) {
//         await AuthPost('users/updateFcmToken', { fcmToken: newToken }, authToken);
//       }
//     });


//     return () => {
//       unsubscribeMessage();
//       unsubscribeRefresh();
//     };

//   }, []);

//   const requestUserPermission = async () => {
//     if (Platform.OS === 'android' && Platform.Version >= 33) {
//       // Android 13+ requires POST_NOTIFICATIONS permission
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
//       );
//       if (granted === PermissionsAndroid.RESULTS.GRANTED) {
//         console.log('Notification permission granted (Android 13+)');
//       } else {
//         console.log('Notification permission denied (Android 13+)');
//       }
//     } else {
//       // iOS or older Android
//       const authStatus = await messaging().requestPermission();
//       const enabled =
//         authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
//         authStatus === messaging.AuthorizationStatus.PROVISIONAL;
//       if (enabled) {
//         console.log('Notification permission granted (iOS/Old Android)');
//       } else {
//         console.log('Notification permission denied (iOS/Old Android)');
//       }
//     }
//   };

//   const checkVersion = async () => {
//     try {
//       if (Platform.OS === "ios") {
//         return;
//       }
//       // 1. Get current app versionCode
//       const currentVersion = parseInt(DeviceInfo.getBuildNumber()); // e.g. "5"
//       // 2. Fetch latest minVersionCode from backend
//       const res = await fetch(FORCE_UPDATE_URL);
//       const data = await res.json();

//       if (currentVersion < data.androidMinVersionCode) {
//         setForceUpdate(true);
//       }
//     } catch (err) {
//       console.log("Version check failed:", err);
//     }
//   };

//   const openPlayStore = () => {
//     Linking.openURL("https://play.google.com/store/apps/details?id=com.vydhyopatientapp");
//   };

//   const syncFcmToken = async () => {
//     try {
//       const authToken = await AsyncStorage.getItem('authToken');
//       if (!authToken) return;

//       const fcmToken = await messaging().getToken();
//       if (fcmToken) {
//         console.log("Syncing FCM Token:", fcmToken);
//         await AuthPost('users/updateFcmToken', { fcmToken }, authToken);
//       }
//     } catch (err) {
//       console.error('Error syncing FCM token:', err);
      
//     }
//   };

//   if (forceUpdate) {
//     return (
//       <View style={styles.forceUpdateContainer}>
//         {/* Main content */}
//         <View style={styles.contentContainer}>
//           {/* Icon container */}
//           <View style={styles.iconContainer}>
//             <View style={styles.iconCircle}>
//               <Text style={styles.iconText}>🚀</Text>
//             </View>
//           </View>
        
//           {/* Title */}
//           <Text style={styles.title}>Update Available</Text>
        
//           {/* Subtitle */}
//           <Text style={styles.subtitle}>
//             We've made some exciting improvements!{'\n'}
//             Please update to continue enjoying the app.
//           </Text>
        
//           {/* Features list */}
//           <View style={styles.featuresContainer}>
//             <View style={styles.featureItem}>
//               <Text style={styles.featureIcon}>✨</Text>
//               <Text style={styles.featureText}>Enhanced performance</Text>
//             </View>
//             <View style={styles.featureItem}>
//               <Text style={styles.featureIcon}>🔧</Text>
//               <Text style={styles.featureText}>Bug fixes & improvements</Text>
//             </View>
//             <View style={styles.featureItem}>
//               <Text style={styles.featureIcon}>🎨</Text>
//               <Text style={styles.featureText}>Fresh new features</Text>
//             </View>
//           </View>
        
//           {/* Update button */}
//           <TouchableOpacity style={styles.updateButton} onPress={openPlayStore}>
//             <Text style={styles.buttonText}>Update Now</Text>
//             <Text style={styles.buttonIcon}>→</Text>
//           </TouchableOpacity>
        
//           {/* Version info */}
//           <Text style={styles.versionText}>
//             This update is required to continue
//           </Text>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <Provider store={store}>
//       <View style={styles.container}>
//         <Routing />
//         <Toast />
//       </View>
//     </Provider>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   forceUpdateContainer: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   contentContainer: {
//     alignItems: 'center',
//     width: '100%',
//   },
//   iconContainer: {
//     marginBottom: 30,
//   },
//   iconCircle: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: '#007AFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   iconText: {
//     fontSize: 40,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#1a1a1a',
//     marginBottom: 15,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 30,
//   },
//   featuresContainer: {
//     width: '100%',
//     marginBottom: 40,
//   },
//   featureItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//     paddingHorizontal: 20,
//   },
//   featureIcon: {
//     fontSize: 20,
//     marginRight: 12,
//   },
//   featureText: {
//     fontSize: 16,
//     color: '#333',
//   },
//   updateButton: {
//     backgroundColor: '#007AFF',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 32,
//     borderRadius: 12,
//     marginBottom: 20,
//     width: '80%',
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginRight: 8,
//   },
//   buttonIcon: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   versionText: {
//     fontSize: 14,
//     color: '#999',
//     textAlign: 'center',
//   },
// });

// export default App;