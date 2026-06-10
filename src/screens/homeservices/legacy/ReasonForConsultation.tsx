import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

// import {
//   pick,
//   types,
//   isErrorWithCode,
//   errorCodes,
// } from '@react-native-documents/picker';

// Import responsive utilities
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  isIOS,
  isAndroid,
  isTablet,
  isSmallDevice,
  isLargeDevice,
  isExtraSmallDevice,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  responsiveWidth,
  responsiveHeight,
  responsiveText,
  moderateScale,
  SAFE_AREA,
  PLATFORM,
} from '../../../utils/responsive';

type UploadedFile = {
  uri: string;
  name: string;
  type: string | null; // mime
  size?: number | null; // bytes
};

/** IN/OUT PARAM TYPES */
type ReasonInParams = {
  doctor: any;
  mode: 'online' | 'clinic' | 'home' | string;
  date: string; // e.g. "27-Aug-2025"
  time: string; // e.g. "9:00 AM"
  prefill?: { reason?: string; reports?: UploadedFile[] };
};

type SelectPatientParams = {
  doctor: any;
  mode: string;
  date: string;
  time: string;
  reason: string;
  reports: UploadedFile[];
};

type RootStackParamList = {
  ReasonForConsultation: ReasonInParams;
  SelectPatient: SelectPatientParams;
};

type Nav = NativeStackNavigationProp<RootStackParamList, 'ReasonForConsultation'>;
type R = RouteProp<RootStackParamList, 'ReasonForConsultation'>;

const MAX_LEN = 500;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

// Translations for multiple languages
const translations: any = {
  en: {
    helperText: 'Please provide details about your condition or the reason you need physiotherapy consultation. This helps our therapists prepare for your visit.',
    describeCondition: 'Describe your condition',
    placeholder: 'Briefly describe your condition or reason for consultation (e.g., back pain, post-surgery rehab)',
    characters: 'characters',
    medicalReports: 'Medical reports (optional)',
    uploadReports: 'Upload medical reports',
    fileTypes: '📄 PDF or 🖼️ image files (max 10MB)',
    remove: 'Remove',
    next: 'Next',
    incomplete: 'Incomplete',
    pleaseEnterReason: 'Please enter your reason for consultation.',
    fileTooLarge: 'File too large',
    filesExceed: 'These files exceed 10MB and were not added',
    pickerError: 'Picker error',
    unableToPick: 'Unable to pick file',
    somethingWrong: 'Something went wrong',
  },
  hi: {
    helperText: 'कृपया अपनी स्थिति या फिजियोथेरेपी परामर्श की आवश्यकता के बारे में विवरण प्रदान करें। इससे हमारे चिकित्सकों को आपके आगमन की तैयारी करने में मदद मिलती है।',
    describeCondition: 'अपनी स्थिति का वर्णन करें',
    placeholder: 'संक्षेप में अपनी स्थिति या परामर्श का कारण बताएं (जैसे, पीठ दर्द, सर्जरी के बाद पुनर्वास)',
    characters: 'वर्ण',
    medicalReports: 'चिकित्सा रिपोर्ट (वैकल्पिक)',
    uploadReports: 'चिकित्सा रिपोर्ट अपलोड करें',
    fileTypes: '📄 PDF या 🖼️ छवि फ़ाइलें (अधिकतम 10MB)',
    remove: 'हटाएं',
    next: 'अगला',
    incomplete: 'अधूरा',
    pleaseEnterReason: 'कृपया परामर्श का अपना कारण दर्ज करें।',
    fileTooLarge: 'फ़ाइल बहुत बड़ी है',
    filesExceed: 'ये फाइलें 10MB से अधिक हैं और नहीं जोड़ी गईं',
    pickerError: 'पिकर त्रुटि',
    unableToPick: 'फ़ाइल चुनने में असमर्थ',
    somethingWrong: 'कुछ गलत हो गया',
  },
  tel: {
    helperText: 'దయచేసి మీ స్థితి లేదా ఫిజియోథెరపీ కన్సల్టేషన్ అవసరం గురించి వివరాలను అందించండి. ఇది మా థెరపిస్టులకు మీ సందర్శన కోసం సిద్ధం కావడానికి సహాయపడుతుంది.',
    describeCondition: 'మీ స్థితిని వివరించండి',
    placeholder: 'సంక్షిప్తంగా మీ స్థితి లేదా కన్సల్టేషన్ కారణాన్ని వివరించండి (ఉదా., వెన్ను నొప్పి, శస్త్రచికిత్స తర్వాత పునరావాసం)',
    characters: 'అక్షరాలు',
    medicalReports: 'వైద్య నివేదికలు (ఐచ్ఛికం)',
    uploadReports: 'వైద్య నివేదికలను అప్లోడ్ చేయండి',
    fileTypes: '📄 PDF లేదా 🖼️ ఇమేజ్ ఫైల్స్ (గరిష్ఠ 10MB)',
    remove: 'తీసేయి',
    next: 'తదుపరి',
    incomplete: 'అసంపూర్ణ',
    pleaseEnterReason: 'దయచేసి మీ కన్సల్టేషన్ కారణాన్ని నమోదు చేయండి.',
    fileTooLarge: 'ఫైల్ చాలా పెద్దగా ఉంది',
    filesExceed: 'ఈ ఫైల్స్ 10MBని మించిపోయాయి మరియు జోడించబడలేదు',
    pickerError: 'పికర్ లోపం',
    unableToPick: 'ఫైల్ను ఎంచుకోలేకపోయింది',
    somethingWrong: 'ఏదో తప్పు జరిగింది',
  },
};

interface ReasonForConsultationScreenProps {
  navigation: Nav;
}

export default function ReasonForConsultationScreen({ navigation }: ReasonForConsultationScreenProps) {
  const route = useRoute<R>();
  const { doctor, mode, date, time } = route.params;
  
  // Get user details from Redux
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || 'en';
  
  // Pick translation set
  const t = translations[appLanguage] || translations.en;

  const [reason, setReason] = useState('');
  const [reports, setReports] = useState<UploadedFile[]>([]);

  const charCount = reason.length;

  const canProceed = useMemo(() => {
    return reason.trim().length > 0;
  }, [reason]);

  const pickReports = async () => {
    // try {
    //   const selection = await pick({
    //     allowMultiSelection: true,
    //     type: [types.pdf, 'image/*'], // accept PDFs and images
    //     presentationStyle: 'formSheet',
    //   });

    //   const mapped: UploadedFile[] = selection.map(f => ({
    //     uri: f.uri,
    //     name: f.name ?? 'file',
    //     type: f.type ?? null,
    //     size: f.size ?? null,
    //   }));

    //   // Enforce max size
    //   const tooLarge = mapped.filter(
    //     f => typeof f.size === 'number' && (f.size as number) > MAX_FILE_BYTES
    //   );
    //   if (tooLarge.length) {
    //     Alert.alert(
    //       t.fileTooLarge,
    //       `${t.filesExceed}:\n- ${tooLarge.map(f => f.name).join('\n- ')}`
    //     );
    //   }
    //   const valid = mapped.filter(f => !f.size || f.size <= MAX_FILE_BYTES);

    //   // Post-filter by MIME (in case a provider ignores the requested types)
    //   const filtered = valid.filter(f => {
    //     const mime = (f.type || '').toLowerCase();
    //     return mime.startsWith('image/') || mime === 'application/pdf';
    //   });

    //   // De-duplicate by name+size+type
    //   const key = (f: UploadedFile) => `${f.name}-${f.size ?? 'u'}-${f.type ?? 't'}`;
    //   const existing = new Set(reports.map(key));
    //   const unique = filtered.filter(f => !existing.has(key(f)));

    //   setReports(prev => [...prev, ...unique]);
    // } catch (err: any) {
    //   if (isErrorWithCode(err)) {
    //     if (err.code === errorCodes.OPERATION_CANCELED) return; // user canceled
    //     Alert.alert(t.pickerError, err.message ?? t.unableToPick);
    //   } else {
    //     Alert.alert(t.pickerError, t.somethingWrong);
    //   }
    // }
  };

  const removeReportAt = (index: number) => {
    setReports(prev => prev.filter((_, i) => i !== index));
  };

  const onNext = () => {
    if (!canProceed) {
      Alert.alert(t.incomplete, t.pleaseEnterReason);
      return;
    }
    navigation.navigate('SelectPatient', {
      doctor,
      date,
      time,
      mode,
      reason: reason.trim(),
      reports,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.container} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.helperText}>
            {t.helperText}
          </Text>

          <Text style={styles.label}>{t.describeCondition}</Text>
          <View style={styles.textAreaWrapper}>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder={t.placeholder}
              placeholderTextColor="#9BB3A8"
              multiline
              maxLength={MAX_LEN}
              style={styles.textArea}
              textAlignVertical="top"
            />
          </View>
          <Text style={styles.counter}>
            {charCount}/{MAX_LEN} {t.characters}
          </Text>

          <Text style={[styles.label, { marginTop: SPACING.lg }]}>{t.medicalReports}</Text>

          <TouchableOpacity activeOpacity={0.85} onPress={pickReports} style={styles.uploadCard}>
            <View style={styles.uploadIconWrap}>
              <Text style={{ fontSize: moderateScale(18), color: "#5E7F74" }}>📎</Text>
            </View>
            <Text style={styles.uploadTitle}>{t.uploadReports}</Text>
            <Text style={styles.uploadSubtitle}>{t.fileTypes}</Text>
          </TouchableOpacity>

          {reports.length > 0 && (
            <View style={styles.filesList}>
              {reports.map((f, idx) => (
                <View key={`${f.name}-${idx}`} style={styles.fileRow}>
                  <View style={styles.fileIconWrap}>
                    <Text style={{ fontSize: moderateScale(16), color: "#1D3354" }}>
                      {(f.type || '').toLowerCase().includes('pdf') ? "📄" : "🖼️"}
                    </Text>
                  </View>
                  <View style={styles.fileMeta}>
                    <Text numberOfLines={1} style={styles.fileName}>
                      {f.name}
                    </Text>
                    {!!f.size && (
                      <Text style={styles.fileSize}>
                        {(f.size / (1024 * 1024)).toFixed(2)} MB
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => removeReportAt(idx)}
                    style={styles.removeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ fontSize: moderateScale(14), color: "#7C8793" }}>{t.remove}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: SPACING.xl }} />

          <TouchableOpacity
            accessibilityRole="button"
            onPress={onNext}
            disabled={!canProceed}
            style={[styles.primaryBtn, !canProceed && styles.primaryBtnDisabled]}
          >
            <Text style={styles.primaryBtnText}>{t.next}</Text>
          </TouchableOpacity>

          <View style={{ height: SAFE_AREA.safeBottom + SPACING.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#EAF7F1' 
  },
  container: { 
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  helperText: { 
    color: '#5E7F74', 
    fontSize: moderateScale(12), 
    lineHeight: moderateScale(16), 
    marginBottom: SPACING.md 
  },
  label: { 
    color: '#0D1724', 
    fontWeight: '600', 
    fontSize: moderateScale(14),
    marginBottom: SPACING.sm 
  },
  textAreaWrapper: {
    borderRadius: LAYOUT.borderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6E7DF',
    ...LAYOUT.shadow.sm,
  },
  textArea: {
    minHeight: responsiveHeight(12),
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    fontSize: moderateScale(14),
    color: '#0D1724',
    lineHeight: moderateScale(18),
  },
  counter: { 
    marginTop: SPACING.xs, 
    fontSize: moderateScale(11), 
    color: '#6F8A81' 
  },
  uploadCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CDE5DA',
    backgroundColor: '#F3FBF7',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingVertical: isTablet ? SPACING.lg : SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...LAYOUT.shadow.sm,
  },
  uploadIconWrap: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2F2EA',
    marginBottom: SPACING.sm,
  },
  uploadTitle: { 
    fontWeight: '600', 
    color: '#1D3354', 
    fontSize: moderateScale(14),
    marginBottom: SPACING.xs 
  },
  uploadSubtitle: { 
    fontSize: moderateScale(11), 
    color: '#6F8A81',
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  filesList: {
    marginTop: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#D6E7DF',
    paddingVertical: SPACING.xs,
    ...LAYOUT.shadow.sm,
  },
  fileRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F7F3',
  },
  fileIconWrap: { 
    width: moderateScale(32), 
    alignItems: 'center' 
  },
  fileMeta: { 
    flex: 1, 
    marginLeft: SPACING.sm 
  },
  fileName: { 
    color: '#0D1724',
    fontSize: moderateScale(13),
  },
  fileSize: { 
    fontSize: moderateScale(11), 
    color: '#6F8A81', 
    marginTop: SPACING.xxs 
  },
  removeBtn: { 
    padding: SPACING.xs 
  },
  primaryBtn: {
    backgroundColor: '#0C3B66',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingVertical: isTablet ? SPACING.lg : SPACING.md,
    alignItems: 'center',
    ...LAYOUT.shadow.md,
    minHeight: LAYOUT.buttonHeight,
    justifyContent: 'center',
  },
  primaryBtnDisabled: { 
    opacity: 0.55 
  },
  primaryBtnText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: moderateScale(14) 
  },
});