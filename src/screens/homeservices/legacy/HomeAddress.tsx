import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSelector } from "react-redux";

// Import responsive utilities
import {
  isTablet,
  SPACING,
  LAYOUT,
  moderateScale,
  SAFE_AREA,
} from '../../../utils/responsive';

export type AddressFormData = {
  building: string;
  floorFlat?: string;
  street: string;
  landmark?: string;
  pincode: string;
  cityState: string;
};

export type VisitContext = {
  doctor: any;
  mode: "online" | "clinic" | "home" | string;
  date: string;
  time: string;
  reason: string;
  reports: any;
  patient: any;
  selectedAddress?: AddressFormData;
};

export type RootStackParamList = {
  HomeAddress: VisitContext;
  Confirm: VisitContext & { formData: AddressFormData };
  ConfirmToPay: VisitContext & { formData: AddressFormData };
};

type HomeNav = NativeStackNavigationProp<RootStackParamList, "HomeAddress">;
type HomeRoute = RouteProp<RootStackParamList, "HomeAddress">;

// Translations for multiple languages
const translations: any = {
  en: {
    addressDetails: "Address Details",
    buildingLabel: "Building/Apartment Name",
    floorFlatLabel: "Floor & Flat Number",
    streetLabel: "Street Name / Locality",
    landmarkLabel: "Landmark",
    pincodeLabel: "Pincode",
    cityStateLabel: "City & State",
    optional: "(Optional)",
    confirmLocation: "Confirm Location",
    buildingError: "Building/Apartment is required.",
    streetError: "Street / Locality is required.",
    pincodeError: "Pincode is required.",
    pincodeInvalidError: "Enter a valid 6-digit pincode.",
    cityStateError: "City & State is required.",
    storageError: "Storage error",
    storageErrorMessage: "Unable to save default address locally.",
  },
  hi: {
    addressDetails: "पता विवरण",
    buildingLabel: "बिल्डिंग/अपार्टमेंट का नाम",
    floorFlatLabel: "मंजिल और फ्लैट नंबर",
    streetLabel: "सड़क का नाम / इलाका",
    landmarkLabel: "लैंडमार्क",
    pincodeLabel: "पिनकोड",
    cityStateLabel: "शहर और राज्य",
    optional: "(वैकल्पिक)",
    confirmLocation: "स्थान की पुष्टि करें",
    buildingError: "बिल्डिंग/अपार्टमेंट आवश्यक है।",
    streetError: "सड़क/इलाका आवश्यक है।",
    pincodeError: "पिनकोड आवश्यक है।",
    pincodeInvalidError: "6 अंकों का मान्य पिनकोड दर्ज करें।",
    cityStateError: "शहर और राज्य आवश्यक है।",
    storageError: "भंडारण त्रुटि",
    storageErrorMessage: "डिफ़ॉल्ट पता स्थानीय रूप से सहेजने में असमर्थ।",
  },
  tel: {
    addressDetails: "చిరునామా వివరాలు",
    buildingLabel: "భవనం/అపార్ట్‌మెంట్ పేరు",
    floorFlatLabel: "అంతస్తు & ఫ్లాట్ నంబర్",
    streetLabel: "వీధి పేరు / స్థానికం",
    landmarkLabel: "ల్యాండ్‌మార్క్",
    pincodeLabel: "పిన్‌కోడ్",
    cityStateLabel: "నగరం & రాష్ట్రం",
    optional: "(ఐచ్ఛికం)",
    confirmLocation: "స్థానాన్ని నిర్ధారించండి",
    buildingError: "భవనం/అపార్ట్‌మెంట్ అవసరం.",
    streetError: "వీధి/స్థానికం అవసరం.",
    pincodeError: "పిన్‌కోడ్ అవసరం.",
    pincodeInvalidError: "6 అంకెల చెల్లుబాటు అయ్యే పిన్‌కోడ్‌ను నమోదు చేయండి.",
    cityStateError: "నగరం & రాష్ట్రం అవసరం.",
    storageError: "స్టోరేజ్ లోపం",
    storageErrorMessage: "డిఫాల్ట్ చిరునామాను స్థానికంగా సేవ్ చేయడం సాధ్యం కాలేదు.",
  },
};

const HomeAddressScreen: React.FC = () => {
  const navigation = useNavigation<HomeNav>();
  const route = useRoute<HomeRoute>();
  const headerHeight = useHeaderHeight();
  const { doctor, mode, date, time, reason, reports, patient, selectedAddress } = route.params;

  // Get user language from Redux
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || "en";
  const t = translations[appLanguage] || translations.en;

  const [building, setBuilding] = useState(selectedAddress?.building || "");
  const [floorFlat, setFloorFlat] = useState(selectedAddress?.floorFlat || "");
  const [street, setStreet] = useState(selectedAddress?.street || "");
  const [landmark, setLandmark] = useState(selectedAddress?.landmark || "");
  const [pincode, setPincode] = useState(selectedAddress?.pincode || "");
  const [cityState, setCityState] = useState(selectedAddress?.cityState || "");

  const errors = useMemo(() => {
    const e: Partial<Record<keyof AddressFormData, string>> = {};
    if (!building.trim()) e.building = t.buildingError;
    if (!street.trim()) e.street = t.streetError;
    if (!pincode.trim()) e.pincode = t.pincodeError;
    else if (!/^\d{6}$/.test(pincode.trim())) e.pincode = t.pincodeInvalidError;
    if (!cityState.trim()) e.cityState = t.cityStateError;
    return e;
  }, [building, street, pincode, cityState, t]);
console.log("errorslok",errors)
  const isValid = Object.keys(errors).length === 0;

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const setFieldTouched = (name: string) => setTouched((prev) => ({ ...prev, [name]: true }));

  const handleSubmit = async () => {
    setTouched({
      building: true,
      street: true,
      pincode: true,
      cityState: true,
      floorFlat: true,
      landmark: true,
    });

    if (!isValid) return;

    const formData: AddressFormData = {
      building: building.trim(),
      floorFlat: floorFlat.trim() || undefined,
      street: street.trim(),
      landmark: landmark.trim() || undefined,
      pincode: pincode.trim(),
      cityState: cityState.trim(),
    };

    try {
      // if (saveAsDefault) {
      //   await AsyncStorage.setItem("defaultHomeAddress", JSON.stringify(formData));
      // }
    } catch {
      Alert.alert(t.storageError, t.storageErrorMessage);
    }

    navigation.navigate("ConfirmToPay", {
      doctor,
      mode,
      date,
      time,
      formData,
      reason,
      reports,
      patient,
    });
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={Platform.select({
          ios: Math.max(headerHeight, 0),
          android: 0,
        })}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator
          persistentScrollbar
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets
        >
          <Text style={styles.sectionTitle}>✎ {t.addressDetails}</Text>

          <Field
            label={t.buildingLabel}
            placeholder={t.buildingLabel}
            value={building}
            onChangeText={setBuilding}
            onBlur={() => setFieldTouched("building")}
            error={touched.building ? errors.building : undefined}
            returnKeyType="next"
          />

          <Field
            label={t.floorFlatLabel}
            optional
            placeholder="e.g., 2nd Floor, Flat 201"
            value={floorFlat}
            onChangeText={setFloorFlat}
            onBlur={() => setFieldTouched("floorFlat")}
            returnKeyType="next"
          />

          <Field
            label={t.streetLabel}
            placeholder={t.streetLabel}
            value={street}
            onChangeText={setStreet}
            onBlur={() => setFieldTouched("street")}
            error={touched.street ? errors.street : undefined}
            returnKeyType="next"
          />

          <Field
            label={t.landmarkLabel}
            optional
            placeholder={t.landmarkLabel}
            value={landmark}
            onChangeText={setLandmark}
            onBlur={() => setFieldTouched("landmark")}
            returnKeyType="next"
          />

          <Field
            label={t.pincodeLabel}
            placeholder="500081"
            keyboardType="number-pad"
            maxLength={6}
            value={pincode}
            onChangeText={(text) => setPincode(text.replace(/[^\d]/g, ""))}
            onBlur={() => setFieldTouched("pincode")}
            error={touched.pincode ? errors.pincode : undefined}
            returnKeyType="next"
          />

          <Field
            label={t.cityStateLabel}
            placeholder="Hyderabad, Telangana"
            value={cityState}
            onChangeText={setCityState}
            onBlur={() => setFieldTouched("cityState")}
            error={touched.cityState ? errors.cityState : undefined}
            autoCapitalize="words"
            returnKeyType="done"
          />

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid}
          >
            <Text style={[styles.submitText, !isValid && styles.submitTextDisabled]}>
              {t.confirmLocation}
            </Text>
          </TouchableOpacity>

          <View style={{ height: SAFE_AREA.safeBottom + SPACING.md }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

function Field({
  label,
  optional,
  error,
  ...inputProps
}: {
  label: string;
  optional?: boolean;
  error?: string;
} & React.ComponentProps<typeof TextInput>) {
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || "en";
  const t = translations[appLanguage] || translations.en;

  return (
    <View style={{ marginBottom: SPACING.sm }}>
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>{label}</Text>
        {optional && <Text style={styles.optionalText}>{t.optional}</Text>}
      </View>
      <TextInput
        {...inputProps}
        placeholderTextColor="#9BA7AE"
        style={[styles.input, !!error && styles.inputError]}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EAF7F1",
  },
  scroll: {
    flex: 1,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
  },
  scrollContent: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  sectionTitle: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    color: "#0C1B1F",
    fontWeight: "700",
    fontSize: moderateScale(16),
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: SPACING.xs,
  },
  labelText: {
    color: "#24343B",
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  optionalText: {
    marginLeft: SPACING.xs,
    color: "#8A9AA2",
    fontSize: moderateScale(11),
  },
  input: {
    height: LAYOUT.inputHeight,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: "#B7E1D4",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: SPACING.md,
    color: "#0C1B1F",
    fontSize: moderateScale(14),
  },
  inputError: {
    borderColor: "#D9534F",
  },
  errorText: {
    marginTop: SPACING.xs,
    color: "#D9534F",
    fontSize: moderateScale(12),
  },
  submitBtn: {
    height: LAYOUT.buttonHeight,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1977F3",
    marginTop: SPACING.md,
  },
  submitBtnDisabled: {
    backgroundColor: "#D3D7DB",
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: moderateScale(15),
  },
  submitTextDisabled: {
    color: "#7E8A90",
  },
});

export default HomeAddressScreen;