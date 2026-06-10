import React, { useEffect, useState } from 'react';
  import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, Platform } from 'react-native';
  import RoundedButton from '../../components/RoundedButton';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import responsive utilities
import {
  isTablet,
  SPACING,
  LAYOUT,
  moderateScale,
  SAFE_AREA,
} from '../../utils/responsive';

type SelectClinicRouteProp = RouteProp<RootStackParamList, 'SelectClinic'>;
type SelectClinicNavigationProp = StackNavigationProp<RootStackParamList, 'SelectClinic'>;

interface SelectClinicProps {
  route: SelectClinicRouteProp;
  navigation: SelectClinicNavigationProp;
}

interface Clinic {
  name: string;
  address: string;
  city: string;
  isPrimary?: boolean;
  days: string;
  time: string;
  clinicName: string;
  status?: string; // Added to match filtering logic
}

/** UI strings for EN / HI / TEL */
type Lang = 'en' | 'hi' | 'tel';
const UI = {
  title: {
    en: 'Select Clinic',
    hi: 'क्लिनिक चुनें',
    tel: 'క్లినిక్ ఎంచుకోండి',
  },
  primary: {
    en: 'Primary',
    hi: 'प्राथमिक',
    tel: 'ప్రాథమిక',
  },
  continue: {
    en: 'Continue',
    hi: 'जारी रखें',
    tel: 'కొనసాగించండి',
  },
} as const;

function normalizeLang(l?: string): Lang {
  if (l === 'en' || l === 'hi' || l === 'tel') return l;
  if (l === 'te') return 'tel'; // just in case
  return 'en';
}

const SelectClinic: React.FC<SelectClinicProps> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const currentUserDetails = useSelector((state: any) => state.currentUser);
  const language = currentUserDetails?.appLanguage;
  const lang: Lang = normalizeLang(language);

  const { doctor } = route.params;
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  
  const handleClinicSelect = (clinic: Clinic) => {
    setSelectedClinic(clinic);
  };

  const [clinics, setClinics] = useState<Clinic[]>([]);
  useEffect(() => {
    const activeClinics = (doctor?.addresses || []).filter((clinic: Clinic) => clinic.status === "Active");
    setClinics(activeClinics);
  }, [doctor?.addresses]);

  useEffect(() => {
    if (clinics.length === 1) {
      setSelectedClinic(clinics[0]);
    }
  }, [clinics]);
  const handleContinue = () => {
    //here first we need to check token is av
    if (selectedClinic) {
      navigation.navigate('DateSelection', {
        doctor,
        clinic: selectedClinic,
         mode: route.params?.mode, 
      });
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EFFFF8" />

      <View style={styles.contentContainer}>
        <ScrollView style={styles.clinicList} showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.clinicListContent}
        >
          {clinics?.map((clinic: Clinic, idx: number) => (
            <TouchableOpacity
              key={clinic.clinicName + idx}
              style={[
                styles.clinicCard,
                selectedClinic?.clinicName === clinic.clinicName
                  ? styles.selectedClinic
                  : styles.unselectedClinic,
              ]}
              onPress={() => handleClinicSelect(clinic)}
            >
              <View style={styles.clinicInfo}>
                <View style={styles.clinicNameRow}>
                  <Text
                    style={[
                      styles.clinicName,
                      {
                        color:
                          selectedClinic?.clinicName === clinic.clinicName
                            ? '#FFFFFF'
                            : '#1F2937',
                      },
                    ]}
                  >
                    {clinic.clinicName}
                  </Text>
                  {clinic.isPrimary && (
                    <View
                      style={[
                        styles.primaryBadge,
                        selectedClinic?.clinicName === clinic.clinicName &&
                          styles.primaryBadgeSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.primaryBadgeText,
                          selectedClinic?.clinicName === clinic.clinicName &&
                            styles.primaryBadgeTextSelected,
                        ]}
                      >
                        {UI.primary[lang]}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.addressContainer}>
                  <Text style={styles.addressIcon}>📍</Text>
                  <Text
                    style={[
                      styles.addressText,
                      {
                        color:
                          selectedClinic?.clinicName === clinic.clinicName
                            ? '#E5E7EB'
                            : '#6B7280',
                      },
                    ]}
                  >
                    {clinic.address}
                    {'\n'}
                    {clinic.city}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {selectedClinic && (
          <View
            style={[
              styles.footer,
              {
                paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, SAFE_AREA.safeBottom) + SPACING.xs : insets.bottom,
              },
            ]}
          >
            <RoundedButton
              title={UI.continue[lang] + '  ➔'}
              onPress={handleContinue}
              style={{
                backgroundColor: '#05294B',
                borderRadius: 999,
                paddingVertical: isTablet ? SPACING.md : SPACING.sm,
                alignItems: 'center',
                minHeight: LAYOUT.buttonHeight,
                justifyContent: 'center',
              }}
              textStyle={{
                color: '#FFFFFF',
                fontSize: moderateScale(14),
                fontWeight: '600',
              }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFFFF8',
  },
  contentContainer: {
    flex: 1,
  },
  // header: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   paddingHorizontal: 16,
  //   paddingVertical: 12,
  //   backgroundColor: '#EFFFF8',
  //   borderBottomWidth: 1,
  //   borderBottomColor: '#E5E7EB',
  // },
  // backButton: {
  //   marginRight: 12,
  // },
  // backArrow: {
  //   fontSize: 24,
  //   color: '#374151',
  // },
  // headerTitle: {
  //   fontSize: 18,
  //   fontWeight: '600',
  //   color: '#1F2937',
  // },  
  clinicList: {
    flex: 1,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
  },
  clinicListContent: {
    paddingTop: SPACING.sm,
    paddingBottom: SAFE_AREA.safeBottom + (isTablet ? SPACING.xl : SPACING.lg),
  },
  clinicCard: {
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.lg : SPACING.md,
    marginVertical: SPACING.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...LAYOUT.shadow.sm,
  },
  unselectedClinic: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedClinic: {
    backgroundColor: '#05294B',
    borderWidth: 1,
    borderColor: '#05294B',
  },
  clinicInfo: {
    flex: 1,
  },
  clinicNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
  },
  clinicName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    flex: 1,
  },
  primaryBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(8),
    marginLeft: SPACING.sm,
  },
  primaryBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  primaryBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '500',
    color: '#05294B',
  },
  primaryBadgeTextSelected: {
    color: '#FFFFFF',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIcon: {
    fontSize: moderateScale(14),
    marginRight: SPACING.sm,
    marginTop: moderateScale(2),
  },
  addressText: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(18),
    flex: 1,
  },
  bottomSpacing: {
    height: SPACING.md,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: isTablet ? SPACING.lg : SPACING.md,
    right: isTablet ? SPACING.lg : SPACING.md,
    backgroundColor: 'transparent',
    paddingTop: SPACING.sm,
  },
  continueButton: {
    backgroundColor: '#05294B',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    alignItems: 'center',
    ...LAYOUT.shadow.md,
    minHeight: LAYOUT.buttonHeight,
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
});

export default SelectClinic;
