import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

// Define the navigation stack type
type RootStackParamList = {
  NursingCare: { serviceType: string };
  Appointment: { doctorName: string; fee: number; experience: string; service: string; location: string };
  HomeServices: undefined;
  SelectLocation: { location: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'NursingCare'>;

const { width, height } = Dimensions.get('window');

// Icons (using Text components as placeholders)
const BackIcon = () => <Text style={styles.iconText}>←</Text>;
const NotificationIcon = () => (
  <View style={styles.notificationContainer}>
    <Text style={styles.iconText}>🔔</Text>
    <View style={styles.notificationBadge}>
      <Text style={styles.badgeText}>3</Text>
    </View>
  </View>
);
const LocationIcon = () => <Text style={styles.locationIconText}>📍</Text>;
const CrosshairIcon = () => <Text style={styles.crosshairText}>⊕</Text>;
const MyLocationIcon = () => <Text style={styles.myLocationText}>📍</Text>;

// ---------- Translations ----------
const translations: any = {
  en: {
    selectYourLocation: "Select Your Location",
    enterAddress: "Enter your address or location",
    detectedLocation: "Detected Location",
    locationAddress: "780 Healthcare Boulevard, Medical District",
    locationNote: "Approximate location based on map center",
    useThisLocation: "Use This Location",
    bottomText: "Make sure the pin is placed at your exact location for accurate services",
    comingSoon: "Coming Soon",
    comingSoonSubtitle: "We're working hard to bring you the best nursing care services at your location",
    feature1: "Professional nursing care at home",
    feature2: "24/7 availability",
    feature3: "Certified healthcare professionals",
    notifyMe: "Notify Me When Available",
  },
  hi: {
    selectYourLocation: "अपना स्थान चुनें",
    enterAddress: "अपना पता या स्थान दर्ज करें",
    detectedLocation: "पता लगाया गया स्थान",
    locationAddress: "780 हेल्थकेयर बुलेवार्ड, मेडिकल डिस्ट्रिक्ट",
    locationNote: "मानचित्र केंद्र के आधार पर अनुमानित स्थान",
    useThisLocation: "इस स्थान का उपयोग करें",
    bottomText: "सटीक सेवाओं के लिए सुनिश्चित करें कि पिन आपके सटीक स्थान पर रखा गया है",
    comingSoon: "जल्द आ रहा है",
    comingSoonSubtitle: "हम आपके स्थान पर सर्वश्रेष्ठ नर्सिंग देखभाल सेवाएं लाने के लिए कड़ी मेहनत कर रहे हैं",
    feature1: "घर पर पेशेवर नर्सिंग देखभाल",
    feature2: "24/7 उपलब्धता",
    feature3: "प्रमाणित स्वास्थ्य पेशेवर",
    notifyMe: "उपलब्ध होने पर मुझे सूचित करें",
  },
  tel: {
    selectYourLocation: "మీ స్థానాన్ని ఎంచుకోండి",
    enterAddress: "మీ చిరునామా లేదా స్థానాన్ని నమోదు చేయండి",
    detectedLocation: "కనుగొనబడిన స్థానం",
    locationAddress: "780 హెల్త్‌కేర్ బౌలేవార్డ్, మెడికల్ డిస్ట్రిక్ట్",
    locationNote: "మ్యాప్ సెంటర్ ఆధారంగా సుమారుగా స్థానం",
    useThisLocation: "ఈ స్థానాన్ని ఉపయోగించండి",
    bottomText: "ఖచ్చితమైన సేవల కోసం పిన్ మీ ఖచ్చితమైన స్థానంలో ఉంచబడిందని నిర్ధారించుకోండి",
    comingSoon: "త్వరలో వస్తోంది",
    comingSoonSubtitle: "మీ స్థానంలో ఉత్తమ నర్సింగ్ సంరక్షణ సేవలను అందించడానికి మేము కష్టపడుతున్నాము",
    feature1: "ఇంటివద్ద ప్రొఫెషనల్ నర్సింగ్ సంరక్షణ",
    feature2: "24/7 అందుబాటులో",
    feature3: "సర్టిఫైడ్ హెల్త్‌కేర్ ప్రొఫెషనల్స్",
    notifyMe: "అందుబాటులో ఉన్నప్పుడు నాకు తెలియజేయండి",
  },
};

const NursingCare: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || "en";
  const t = translations[appLanguage] || translations.en;
  const [address, setAddress] = useState('');

  const handleBack = () => {
    navigation.navigate('HomeServices');
  };

  const handleUseLocation = () => {
    navigation.navigate('SelectLocation', { location: t.locationAddress });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Enhanced Coming Soon Overlay */}
      <View style={styles.blurOverlay}>
        <View style={styles.comingSoonCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.comingSoonIcon}>🚧</Text>
          </View>
          <Text style={styles.comingSoonTitle}>{t.comingSoon}</Text>
          <Text style={styles.comingSoonSubtitle}>
            {t.comingSoonSubtitle}
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• {t.feature1}</Text>
            <Text style={styles.featureItem}>• {t.feature2}</Text>
            <Text style={styles.featureItem}>• {t.feature3}</Text>
          </View>
          <TouchableOpacity style={styles.notifyButton}>
            <Text style={styles.notifyButtonText}>{t.notifyMe}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.selectYourLocation}</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <NotificationIcon />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t.enterAddress}
          placeholderTextColor="#A0AEC0"
          value={address}
          onChangeText={setAddress}
        />
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {/* Grid background to simulate map */}
        <View style={styles.mapGrid}>
          {Array.from({ length: 20 }, (_, i) => (
            <View key={i} style={styles.gridRow}>
              {Array.from({ length: 4 }, (_, j) => (
                <View key={j} style={styles.gridCell} />
              ))}
            </View>
          ))}
        </View>

        {/* Center Pin */}
        <View style={styles.centerPin}>
          <View style={styles.pinContainer}>
            <View style={styles.pin}>
              <CrosshairIcon />
            </View>
            <View style={styles.pinShadow} />
          </View>
        </View>

        {/* Zoom Controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton}>
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton}>
            <Text style={styles.zoomText}>−</Text>
          </TouchableOpacity>
        </View>

        {/* My Location Button */}
        <TouchableOpacity style={styles.myLocationButton}>
          <MyLocationIcon />
        </TouchableOpacity>
      </View>

      {/* Location Info */}
      <View style={styles.locationInfo}>
        <View style={styles.locationRow}>
          <LocationIcon />
          <View style={styles.locationText}>
            <Text style={styles.locationTitle}>{t.detectedLocation}</Text>
            <Text style={styles.locationAddress}>{t.locationAddress}</Text>
            <Text style={styles.locationNote}>{t.locationNote}</Text>
          </View>
        </View>
      </View>

      {/* Use Location Button */}
      <TouchableOpacity style={styles.useLocationButton} onPress={handleUseLocation}>
        <Text style={styles.useLocationText}>{t.useThisLocation}</Text>
      </TouchableOpacity>

      {/* Bottom Text */}
      <Text style={styles.bottomText}>
        {t.bottomText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 20,
  },
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: width * 0.9,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 15,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF5E1',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  comingSoonIcon: {
    fontSize: 40,
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 12,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  featureItem: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
    textAlign: 'left',
  },
  notifyButton: {
    backgroundColor: '#00203F',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
  },
  notifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  notificationButton: {
    padding: 8,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E53E3E',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconText: {
    fontSize: 20,
    color: '#4A5568',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D3748',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F7FAFC',
  },
  mapGrid: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  gridRow: {
    flexDirection: 'row',
    flex: 1,
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -30 }],
    alignItems: 'center',
  },
  pinContainer: {
    alignItems: 'center',
  },
  pin: {
    width: 30,
    height: 30,
    backgroundColor: '#3182CE',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pinShadow: {
    width: 6,
    height: 6,
    backgroundColor: '#000',
    borderRadius: 3,
    opacity: 0.2,
    marginTop: 2,
  },
  crosshairText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    top: '30%',
  },
  zoomButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  zoomText: {
    fontSize: 18,
    color: '#4A5568',
    fontWeight: 'bold',
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    width: 50,
    height: 50,
    backgroundColor: '#3182CE',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  myLocationText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  locationInfo: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIconText: {
    fontSize: 20,
    color: '#3182CE',
    marginRight: 12,
    marginTop: 2,
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
  },
  locationNote: {
    fontSize: 12,
    color: '#718096',
  },
  useLocationButton: {
    backgroundColor: '#00203F',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useLocationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#718096',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default NursingCare;