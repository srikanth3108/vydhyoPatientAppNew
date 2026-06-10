import React, { useEffect } from 'react';
import { AuthFetch, ENDPOINTS } from '../../services';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import responsive utilities
import {
  responsiveWidth,
  responsiveHeight,
  responsiveSafeHeight,
  responsiveText,
  scale,
  verticalScale,
  moderateScale,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  isTablet,
  isIOS,
  isAndroid,
  PLATFORM,
  SAFE_AREA,
} from '../../utils/responsive';
;
import { useDispatch } from 'react-redux';

type RootStackParamList = {
  LanguageSelection: undefined;
  Home: undefined;
};

const SplashScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuthToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUserId = await AsyncStorage.getItem('userId');
       
        if (storedToken && storedUserId) {
          const profileResponse = await AuthFetch(ENDPOINTS.GET_USER(), storedToken);
          console.log('Profile response:', profileResponse);

          if (
            profileResponse.status === 'success' &&
            'data' in profileResponse &&
            profileResponse.data
          ) {
            navigation.navigate('Home' as never);
            const userData = profileResponse.data.data;
            const id = userData.UserId;
            dispatch({ type: 'currentUser', payload: userData });
            dispatch({ type: 'currentUserID', payload: id });
          } else {
            // Clear invalid token/userId and stay on LanguageSelection
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userId');
          }
         
        }else{
          // Wait briefly for useReferralCode hook to finish saving code
          await new Promise(resolve => setTimeout(resolve, 1500));
          // Check if user came via a referral link — skip to Register directly
          const referralCode = await AsyncStorage.getItem('referralCode');
          if (referralCode) {
            console.log('[Splash] 🔗 Referral code found, skipping to Register:', referralCode);
            navigation.navigate('Register' as never);
          } else {
            //navigate to LanguageSelection
            navigation.navigate('LanguageSelection');
          }
        }
      } catch (error) {
        console.error('Error checking auth token:', error);
        // Clear invalid token/userId and stay on LanguageSelection
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userId');
      }
    };

    checkAuthToken();
  }, [dispatch, navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDFFF7',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: PLATFORM.STATUS_BAR_HEIGHT,
  },
  logo: {
    width: isTablet ? responsiveWidth(60) : responsiveWidth(80),
    height: isTablet ? responsiveWidth(60) : responsiveWidth(80),
  },
});

export default SplashScreen;
