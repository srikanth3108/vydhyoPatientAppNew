import React, { useEffect, useState, useRef } from 'react';
import { AuthPost, AuthPut, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  ActionSheetIOS,
  Modal,
  Pressable,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RootStackParamList } from '../../navigation/navigationTypes';
import { useSelector, useDispatch } from 'react-redux';
;
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// responsive utils
import {
  SPACING,
  FONT_SIZE,
  LAYOUT,
  responsiveWidth,
  responsiveHeight,
  responsiveText,
  moderateScale,
  isTablet,
  SAFE_AREA,
} from '../../utils/responsive';

// ---- i18n helpers (same approach as other screens) ----
type Lang = 'en' | 'hi' | 'tel';
const normalizeLang = (l?: string): Lang => {
  if (l === 'hi') return 'hi';
  if (l === 'tel' || l === 'te') return 'tel';
  return 'en';
};

const TR = {
  // Headers & actions
  addFamily: { en: '', hi: '', tel: '' },
  editProfile: { en: '', hi: '', tel: '' },
  skip: { en: 'Skip', hi: 'छोड़ें', tel: 'దాటవేయి' },
  submit: { en: 'Submit', hi: 'जमा करें', tel: 'సమర్పించండి' },
  update: { en: 'Update', hi: 'अपडेट करें', tel: 'అప్డేట్' },

  // Field labels
  fullName: { en: 'Full Name', hi: 'पूरा नाम', tel: 'పూర్తి పేరు' },
  lastName: { en: 'Last Name', hi: 'उपनाम', tel: 'ఇంటి పేరు' },
  dob: { en: 'Date of Birth', hi: 'जन्म तिथि', tel: 'పుట్టిన తేదీ' },
  age: { en: 'Age', hi: 'उम्र', tel: 'వయసు' },
  gender: { en: 'Gender', hi: 'लिंग', tel: 'లింగం' },
  mobileNumber: { en: 'Mobile Number', hi: 'मोबाइल नंबर', tel: 'మొబైల్ నంబర్' },
  relation: { en: 'Relation', hi: 'रिश्ता', tel: 'సంబంధం' },

  // Placeholders
  phFullName: { en: 'Enter your Full Name', hi: 'अपना पूरा नाम दर्ज करें', tel: 'మీ పూర్తి పేరు నమోదు చేయండి' },
  phLastName: { en: 'Enter your Last Name', hi: 'अपना उपनाम दर्ज करें', tel: 'మీ ఇంటి పేరు నమోదు చేయండి' },
  phDOB: { en: 'DD-MM-YYYY', hi: 'DD-MM-YYYY', tel: 'DD-MM-YYYY' },
  phAge: { en: 'e.g., 7, 6m, 2y, 15d, 5y10d', hi: 'उदाहरण, 7, 6m, 2y, 15d, 5y10d', tel: 'ఉదా., 7, 6m, 2y, 15d, 5y10d' },
  phMobile: { en: 'Enter your Mobile number', hi: 'अपना मोबाइल नंबर दर्ज करें', tel: 'మీ మొబైల్ నంబర్ నమోదు చేయండి' },

  // Pickers
  select: { en: 'Select', hi: 'चुनें', tel: 'ఎంచుకోండి' },
  selectRelation: { en: 'Select Relation', hi: 'रिश्ता चुनें', tel: 'సంబంధాన్ని ఎంచుకోండి' },

  // Gender labels
  genderMale: { en: 'Male', hi: 'पुरुष', tel: 'పురుషుడు' },
  genderFemale: { en: 'Female', hi: 'महिला', tel: 'స్త్రీ' },
  genderOther: { en: 'Other', hi: 'अन्य', tel: 'ఇతరులు' },

  // Relation labels (values remain in English for backend)
  relParent: { en: 'Parent', hi: 'माता-पिता', tel: 'తల్లిదండ్రులు' },
  relChild: { en: 'Child', hi: 'बच्चा', tel: 'బిడ్డ' },
  relSelf: { en: 'Self', hi: 'स्वयं', tel: 'స్వయం' },
  relOther: { en: 'Other', hi: 'अन्य', tel: 'ఇతరులు' },

  // Validation & toasts
  missingFields: { en: 'Missing required fields', hi: 'अनिवार्य फ़ील्ड खाली हैं', tel: 'అవసరమైన ఫీల్డ్స్ లేవు' },
  fixHighlighted: { en: 'Please fix the Mandatory fields.', hi: 'कृपया हाइलाइट की गई फ़ील्ड्स ठीक करें।', tel: 'హైలైట్ చేసిన ఫీల్డ్స్ సరిచూడండి.' },
  success: { en: 'Success', hi: 'सफल', tel: 'విజయం' },
  error: { en: 'Error', hi: 'त्रुटि', tel: 'లోపం' },

  fullNameReq: { en: 'Full Name is required', hi: 'पूरा नाम आवश्यक है', tel: 'పూర్తి పేరు అవసరం' },
  lastNameReq: { en: 'Last Name is required', hi: 'उपनाम आवश्यक है', tel: 'ఇంటి పేరు అవసరం' },
  dobReq: { en: 'Date of Birth is required', hi: 'जन्म तिथि आवश्यक है', tel: 'పుట్టిన తేదీ అవసరం' },
  dobInvalid: { en: 'Enter a valid date', hi: 'मान्य तिथि दर्ज करें', tel: 'చెల్లుబాటు అయ్యే తేదీ ఇవ్వండి' },
  dobFuture: { en: 'DOB cannot be in the future', hi: 'जन्म तिथि भविष्य की नहीं हो सकती', tel: 'పుట్టిన తేదీ భవిష్యత్తులో ఉండకూడదు' },
  ageReq: { en: 'Age is required', hi: 'उम्र आवश्यक है', tel: 'వయసు అవసరం' },
  ageInvalid: { en: 'Invalid age format. Use e.g., 7, 6m, 2y, 15d, 5y10d', hi: 'अमान्य उम्र प्रारूप। उदाहरण: 7, 6m, 2y, 15d, 5y10d', tel: 'చెల్లని వయసు ఫార్మాట్. ఉదా., 7, 6m, 2y, 15d, 5y10d' },
  genderReq: { en: 'Gender is required', hi: 'लिंग आवश्यक है', tel: 'లింగం అవసరం' },
  mobileReq: { en: 'Mobile number is required', hi: 'मोबाइल नंबर आवश्यक है', tel: 'మొబైల్ నంబర్ అవసరం' },
  mobileInvalid: { en: 'Enter a valid 10-digit mobile number', hi: 'मान्य 10 अंकों का मोबाइल नंबर दर्ज करें', tel: 'చెల్లుబాటు అయ్యే 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి' },
  relationReq: { en: 'Relation is required', hi: 'रिश्ता आवश्यक है', tel: 'సంబంధం అవసరం' },

  profileUpdated: { en: 'Profile updated successfully', hi: 'प्रोफ़ाइल सफलतापूर्वक अपडेट हुई', tel: 'ప్రొఫైల్ విజయవంతంగా అప్డేట్ అయింది' },
  familyAdded: { en: 'Family member added successfully', hi: 'परिवार का सदस्य सफलतापूर्वक जोड़ा गया', tel: 'కుటుంబ సభ్యుడు విజయవంతంగా చేర్చబడింది' },
  failUpdate: { en: 'Failed to update profile', hi: 'प्रोफ़ाइल अपडेट असफल', tel: 'ప్రొఫైల్ అప్డేట్ విఫలమైంది' },
  failAdd: { en: 'Failed to add family member', hi: 'परिवार सदस्य जोड़ना असफल', tel: 'కుటుంబ సభ్యుని చేర్చడం విఫలమైంది' },
};

const GENDER_VALUES = ['Male', 'Female', 'Other'] as const;
const RELATION_VALUES = ['parent', 'child', 'self', 'other'] as const;

const AddFamily: React.FC = () => {
  const route = useRoute<any>();
  const { from, member } = route.params || {};
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const lang: Lang = normalizeLang(currentuserDetails?.appLanguage);
  const t = (k: keyof typeof TR) => TR[k][lang];
  const insets = useSafeAreaInsets();

  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'AddFamily'>>();
  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const mobileInputRef = useRef<TextInput>(null);
  const ageInputRef = useRef<TextInput>(null);
  const lastnameInputRef = useRef<TextInput>(null);
  const firstnameInputRef = useRef<TextInput>(null);

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    DOB: '',
    gender: '',
    age: '',
    mobile: '',
    familyProvider: currentuserDetails?.userId,
    relationship: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [modalPickerVisible, setModalPickerVisible] = useState(false);
  const [modalPickerType, setModalPickerType] = useState<'gender' | 'relation' | null>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  useEffect(() => {
    if (from === 'myself') {
      setForm(prev => ({
        ...prev,
        mobile: currentuserDetails?.mobile || '',
        relationship: 'self',
        familyProvider: currentuserDetails?.userId,
      }));
    } else if (from === 'edit' && member) {
      const calculatedAge = member.DOB ? calculateAgeFromDOB(member.DOB) : member.age?.toString() || '';
      setForm({
        firstname: member.firstname || '',
        lastname: member.lastname || '',
        DOB: member.DOB || member.dob || '',
        gender: member.gender || '',
        age: calculatedAge,
        mobile: member.mobile || '',
        familyProvider: currentuserDetails?.userId,
        relationship: member.relationship || '',
      });
    }
  }, [from, member, currentuserDetails]);

const scrollToInput = (ref: React.RefObject<any>, fieldName: string) => {
  setTimeout(() => {
    let scrollY = 0;
      switch (fieldName) {
      case 'firstname':
        scrollY = 0;
        break;
      case 'lastname':
        scrollY = responsiveHeight(8);
        break;
      case 'age':
        scrollY = responsiveHeight(25);
        break;
      case 'mobile':
        scrollY = responsiveHeight(35);
        break;
      default:
        scrollY = 0;
    }
    
    scrollViewRef.current?.scrollTo({
      x: 0,
      y: scrollY,
      animated: true
    });
  }, 100);
};
const handleInputFocus = (ref: React.RefObject<any>, fieldName: string) => {
  scrollToInput(ref, fieldName);
};

  const validateAge = (age: string): boolean => {
    if (!age) return false;
    const trimmed = age.trim();
    return /^\d+$/.test(trimmed) || /^(\d+[myd])(\s?\d+[myd])*$/i.test(trimmed);
  };

  const calculateAgeFromDOB = (dob: string): string => {
    if (!dob) return "";
    try {
      const [day, month, year] = dob.split('-').map(Number);
      const dobDate = new Date(year, month - 1, day);
      const today = new Date();
      if (dobDate > today) return "0d";

      const diffMs = today.getTime() - dobDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365.25);
      const remainingDaysAfterYears = diffDays - (years * 365.25);
      const months = Math.floor(remainingDaysAfterYears / 30.44);
      const days = Math.round(remainingDaysAfterYears - (months * 30.44));

      let ageText = "";
      if (years > 0) ageText += `${years}y `;
      if (months > 0) ageText += `${months}m `;
      if (days > 0 || ageText === "") ageText += `${days}d`;
      return ageText.trim();
    } catch (error) {
      return "";
    }
  };

  const handleDateChangeAndroid = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = moment(selectedDate).format('DD-MM-YYYY');
      const age = calculateAgeFromDOB(formattedDate);
      setForm(prev => ({ ...prev, DOB: formattedDate, age }));
      setErrors(prev => ({ ...prev, DOB: '', age: '' }));
    }
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      setShowDatePicker(true);
    } else {
      const seed = form.DOB ? moment(form.DOB, 'DD-MM-YYYY').toDate() : new Date();
      setTempDate(seed);
      setShowDateModal(true);
    }
  };

  const confirmDateSelection = () => {
    const formattedDate = moment(tempDate).format('DD-MM-YYYY');
    const age = calculateAgeFromDOB(formattedDate);
    setForm(prev => ({ ...prev, DOB: formattedDate, age }));
    setErrors(prev => ({ ...prev, DOB: '', age: '' }));
    setShowDateModal(false);
  };

  const cancelDateSelection = () => {
    setShowDateModal(false);
  };

  const handleChange = (name: string, value: string) => {
    let validatedValue = value;

    if (name === 'firstname' || name === 'lastname') {
      validatedValue = value.replace(/[^A-Za-z ]/g, "");
    } else if (name === 'mobile') {
      let digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length === 1 && !/^[6-9]/.test(digitsOnly)) return;
      if (digitsOnly.length > 10) digitsOnly = digitsOnly.slice(0, 10);
      validatedValue = digitsOnly;
    } else if (name === 'age') {
      validatedValue = value.replace(/[^0-9myd\s]/gi, "").replace(/\s+/g, ' ').trim();
      if (validatedValue.length > 20) validatedValue = validatedValue.slice(0, 20);
      if (validatedValue && !validateAge(validatedValue)) {
        setErrors(prev => ({ ...prev, age: t('ageInvalid') }));
      } else {
        setErrors(prev => ({ ...prev, age: '' }));
      }
    }

    setForm(prev => {
      const newData = { ...prev, [name]: validatedValue };

      if (name === 'DOB') {
        if (value) {
          const calculatedAge = calculateAgeFromDOB(value);
          if (calculatedAge) newData.age = calculatedAge;
        } else {
          newData.age = "";
        }
      } else if (name === 'age' && validatedValue && validateAge(validatedValue)) {
        const today = new Date();
        let calculatedDOB = new Date(today);

        if (/^\d+$/.test(validatedValue)) {
          calculatedDOB.setFullYear(today.getFullYear() - parseInt(validatedValue));
        } else {
          const ageParts = validatedValue.match(/\d+[myd]/gi) || [];
          ageParts.forEach(part => {
            const match = part.match(/(\d+)([myd])/i);
            if (match) {
              const value = parseInt(match[1]);
              const unit = match[2].toLowerCase();
              if (unit === 'y') calculatedDOB.setFullYear(calculatedDOB.getFullYear() - value);
              else if (unit === 'm') calculatedDOB.setMonth(calculatedDOB.getMonth() - value);
              else if (unit === 'd') calculatedDOB.setDate(calculatedDOB.getDate() - value);
            }
          });
        }

        const day = String(calculatedDOB.getDate()).padStart(2, '0');
        const month = String(calculatedDOB.getMonth() + 1).padStart(2, '0');
        const year = calculatedDOB.getFullYear();
        newData.DOB = `${day}-${month}-${year}`;
      }

      return newData;
    });

    if (errors[name] && name !== 'age') setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    const name = form.firstname?.trim();
    const lname = form.lastname?.trim();
    const dobStr = form.DOB?.trim();
    const genderSel = form.gender?.trim();
    const relationSel = form.relationship?.trim();
    const mobileDigits = (form.mobile || '').replace(/\D/g, '');
    const ageStr = form.age?.trim();

    if (!name) e.firstname = t('fullNameReq');
    if (!lname) e.lastname = t('lastNameReq');

    if (dobStr) {
      const parsed = moment(dobStr, 'DD-MM-YYYY').toDate();
      if (isNaN(parsed.getTime())) e.DOB = t('dobInvalid');
      else if (parsed > new Date()) e.DOB = t('dobFuture');
    }

    if (!ageStr) e.age = t('ageReq');
    else if (!validateAge(ageStr)) e.age = t('ageInvalid');

    if (!genderSel) e.gender = t('genderReq');

    if (!mobileDigits) e.mobile = t('mobileReq');
    else if (mobileDigits.length !== 10) e.mobile = t('mobileInvalid');

    if (!relationSel) e.relationship = t('relationReq');

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
      

    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: t('missingFields'),
        text2: t('fixHighlighted'),
        position: 'top',
        visibilityTime: 2500,
      });
      return;
    }

    const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Please login',
          text2: 'You need to be logged in to perform this action.',
          position: 'top',
          visibilityTime: 3000,
        });
        navigation.navigate('Login');
        return;
      }


    setLoading(true);
    try {
      const mobileDigits = form.mobile.replace(/\D/g, '');
      const payload = {
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        gender: form.gender.trim(),
        age: form.age.trim(),
        DOB: form.DOB.trim(),
        mobile: mobileDigits,
        familyProvider: currentuserDetails.userId,
        relationship: form.relationship.trim(),
      };

      let response: any;

      if (from === 'myself' || from === 'edit') {
        response = await AuthPut(
          ENDPOINTS.UPDATE_PATIENT((member?.userId || currentuserDetails.userId)),
          payload,
          token
        );
        if (response?.status === 'success') {
          const userData = response.data.data;
          const id = userData.userId;
          if ((form.relationship || '').toLowerCase() === 'self') {
            dispatch({ type: 'currentUser', payload: userData });
            dispatch({ type: 'currentUserID', payload: id });
          }
          Toast.show({
            type: 'success',
            text1: t('success'),
            text2: t('profileUpdated'),
            position: 'top',
            visibilityTime: 3000,
          });
        }
      } else {
        response = await AuthPost(ENDPOINTS.CREATE_PATIENT_FROM_PATIENT_APP, payload, token);
        if (response?.status === 'success') {
          Toast.show({
            type: 'success',
            text1: t('success'),
            text2: t('familyAdded'),
            position: 'top',
            visibilityTime: 3000,
          });
        }
      }

if (response?.status === 'success') {
  // Navigate based on where we came from
  if (from === 'myself' || from === 'appointment' || from === 'edit') {
    // For appointment flow or edit mode, go back
    navigation.goBack();
  } else {
    // For direct creation (from MyFamily or elsewhere), go to MyFamily
    navigation.navigate('MyFamily');
  }
}
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: (from === 'edit' || from === 'myself') ? t('failUpdate') : t('failAdd'),
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => navigation.navigate('Home');

  const inputStyle = (field: string) => [styles.input, errors[field] ? styles.inputError : null];
  
  const openPicker = (type: 'gender' | 'relation') => {
    if (Platform.OS === 'ios') {
      const options = type === 'gender'
        ? [TR.genderMale[lang], TR.genderFemale[lang], TR.genderOther[lang], 'Cancel']
        : [TR.relParent[lang], TR.relChild[lang], TR.relSelf[lang], TR.relOther[lang], 'Cancel'];

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex?: number) => {
          if (buttonIndex === undefined) return;
          if (type === 'gender') {
            if (buttonIndex < 3) {
              const val = ['Male', 'Female', 'Other'][buttonIndex];
              handleChange('gender', val);
            }
          } else {
            if (buttonIndex < 4) {
              const val = ['parent', 'child', 'self', 'other'][buttonIndex];
              handleChange('relationship', val);
            }
          }
        }
      );
    } else {
      setModalPickerType(type);
      setModalPickerVisible(true);
    }
  };

  const closeModalPicker = () => {
    setModalPickerVisible(false);
    setModalPickerType(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {/* Fixed Header */}
        <View style={styles.fixedHeader}>
          {from !== 'edit' && from !== 'myself' && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>{t('skip')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Scrollable Content */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContainer,
            {
              paddingBottom: isKeyboardVisible ? LAYOUT.footerHeight : SAFE_AREA.safeBottom + SPACING.lg,
            }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
        >
          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('fullName')} <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                ref={firstnameInputRef}
                style={inputStyle('firstname')}
                value={form.firstname}
                onChangeText={(value) => handleChange('firstname', value)}
                placeholder={t('phFullName')}
                placeholderTextColor="#999"
                returnKeyType="next"
                onSubmitEditing={() => lastnameInputRef.current?.focus()}
                onFocus={() => handleInputFocus(firstnameInputRef, 'firstname')}
              />
              {errors.firstname ? <Text style={styles.errorText}>{errors.firstname}</Text> : null}
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('lastName')} <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                ref={lastnameInputRef}
                style={inputStyle('lastname')}
                value={form.lastname}
                onChangeText={(value) => handleChange('lastname', value)}
                placeholder={t('phLastName')}
                placeholderTextColor="#999"
                returnKeyType="next"
                onSubmitEditing={() => ageInputRef.current?.focus()}
                onFocus={() => handleInputFocus(lastnameInputRef, 'lastname')}
              />
              {errors.lastname ? <Text style={styles.errorText}>{errors.lastname}</Text> : null}
            </View>

            {/* DOB & Age */}
            <View style={styles.rowContainer}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>{t('dob')}</Text>
                <TouchableOpacity onPress={openDatePicker}>
                  <TextInput
                    style={inputStyle('DOB')}
                    value={form.DOB}
                    placeholder={t('phDOB')}
                    placeholderTextColor="#999"
                    editable={false}
                    pointerEvents="none"
                  />
                </TouchableOpacity>
                {showDatePicker && Platform.OS === 'android' && (
                  <DateTimePicker
                    value={form.DOB ? moment(form.DOB, 'DD-MM-YYYY').toDate() : new Date()}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChangeAndroid}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                  />
                )}

                {errors.DOB ? <Text style={styles.errorText}>{errors.DOB}</Text> : null}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>{t('age')} <Text style={styles.asterisk}>*</Text></Text>
                <TextInput
                  ref={ageInputRef}
                  style={inputStyle('age')}
                  value={form.age}
                  onChangeText={(value) => handleChange('age', value)}
                  placeholder={t('phAge')}
                  placeholderTextColor="#999"
                  maxLength={20}
                  returnKeyType="next"
                  onSubmitEditing={() => mobileInputRef.current?.focus()}
                  onFocus={() => handleInputFocus(ageInputRef, 'age')}
                />
                {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}
              </View>
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('gender')} <Text style={styles.asterisk}>*</Text></Text>

              {Platform.OS === 'android' ? (
              <View style={[styles.pickerContainer, errors.gender ? styles.pickerContainerError : null]}>
                <Picker
                  style={styles.picker}
                  selectedValue={form.gender}
                  onValueChange={(value) => handleChange('gender', value)}
                >
                  <Picker.Item label={t('select')} value="" />
                  <Picker.Item label={TR.genderMale[lang]} value="Male" />
                  <Picker.Item label={TR.genderFemale[lang]} value="Female" />
                  <Picker.Item label={TR.genderOther[lang]} value="Other" />
                </Picker>
              </View>
            ) : (
                <TouchableOpacity
                  style={[styles.input, errors.gender ? styles.inputError : null, styles.iosPickerTouchable]}
                  onPress={() => openPicker('gender')}
                >
                  <Text style={form.gender ? styles.pickerText : styles.pickerPlaceholder}>
                    {form.gender ? (form.gender === 'Male' ? TR.genderMale[lang] : form.gender === 'Female' ? TR.genderFemale[lang] : TR.genderOther[lang]) : t('select')}
                  </Text>
                </TouchableOpacity>
              )}

              {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
            </View>
            

            {/* Mobile */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('mobileNumber')} <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                ref={mobileInputRef}
                style={inputStyle('mobile')}
                value={form.mobile}
                onChangeText={(value) => handleChange('mobile', value)}
                placeholder={t('phMobile')}
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                returnKeyType="done"
                maxLength={10}
                editable={(form.relationship || '').toLowerCase() !== 'self'}
                onFocus={() => handleInputFocus(mobileInputRef, 'mobile')}
              />
              {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}
            </View>

            {/* Relation */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('relation')} <Text style={styles.asterisk}>*</Text></Text>
            {Platform.OS === 'android' ? (
              <View style={[styles.pickerContainer, errors.relationship ? styles.pickerContainerError : null]}>
                <Picker
                  style={styles.picker}
                  selectedValue={form.relationship}
                  onValueChange={(value) => handleChange('relationship', value)}
                  enabled={(form.relationship || '').toLowerCase() !== 'self'}
                >
                  <Picker.Item label={t('selectRelation')} value="" />
                  <Picker.Item label={TR.relParent[lang]} value="parent" />
                  <Picker.Item label={TR.relChild[lang]} value="child" />
                  <Picker.Item label={TR.relSelf[lang]} value="self" />
                  <Picker.Item label={TR.relOther[lang]} value="other" />
                </Picker>
              </View>
              ) : (
                <TouchableOpacity
                  style={[styles.input, errors.relationship ? styles.inputError : null, styles.iosPickerTouchable]}
                  onPress={() => openPicker('relation')}
                  disabled={(form.relationship || '').toLowerCase() === 'self'}
                >
                  <Text style={form.relationship ? styles.pickerText : styles.pickerPlaceholder}>
                    {form.relationship ? (form.relationship === 'parent' ? TR.relParent[lang] : form.relationship === 'child' ? TR.relChild[lang] : form.relationship === 'self' ? TR.relSelf[lang] : TR.relOther[lang]) : t('selectRelation')}
                  </Text>
                </TouchableOpacity>
              )}

              {errors.relationship ? <Text style={styles.errorText}>{errors.relationship}</Text> : null}
            </View>

          </View>
          <View style={[styles.bottomSpacing, { height: isKeyboardVisible ? SPACING.lg : SPACING.xxl }]} />
        </ScrollView>

        {/* Fixed Footer */}
        <View
          style={[
            styles.footer,
            {
              paddingBottom: SAFE_AREA.safeBottom + SPACING.sm,
              bottom: isKeyboardVisible ? (Platform.OS === 'ios' ? SPACING.lg : SPACING.md) : 0,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.submitButton, loading ? styles.submitButtonDisabled : null]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.submitButtonText}>
              {from === 'edit' || from === 'myself' ? t('update') : t('submit')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* iOS modal for date picker */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDateModal}
          animationType="slide"
          transparent
          onRequestClose={cancelDateSelection}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.dateModalContent}>
              <View style={styles.dateModalHeader}>
                <Pressable onPress={cancelDateSelection}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </Pressable>
                <Pressable onPress={confirmDateSelection}>
                  <Text style={styles.modalDone}>Done</Text>
                </Pressable>
              </View>
              <View style={styles.datePickerWrap}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={(_, d) => {
                    if (d) setTempDate(d);
                  }}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android modal picker fallback */}
      <Modal
        visible={modalPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModalPicker}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={closeModalPicker}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
            </View>
            <View style={styles.modalPickerWrap}>
              {modalPickerType === 'gender' ? (
                <Picker
                  selectedValue={form.gender}
                  onValueChange={(value) => handleChange('gender', value)}
                >
                  <Picker.Item label={t('select')} value="" />
                  <Picker.Item label={TR.genderMale[lang]} value="Male" />
                  <Picker.Item label={TR.genderFemale[lang]} value="Female" />
                  <Picker.Item label={TR.genderOther[lang]} value="Other" />
                </Picker>
              ) : modalPickerType === 'relation' ? (
                <Picker
                  selectedValue={form.relationship}
                  onValueChange={(value) => handleChange('relationship', value)}
                >
                  <Picker.Item label={t('selectRelation')} value="" />
                  <Picker.Item label={TR.relParent[lang]} value="parent" />
                  <Picker.Item label={TR.relChild[lang]} value="child" />
                  <Picker.Item label={TR.relSelf[lang]} value="self" />
                  <Picker.Item label={TR.relOther[lang]} value="other" />
                </Picker>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDFFF7',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    backgroundColor: '#EDFFF7',
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    height: LAYOUT.headerHeight,
  },
  skipButton: { 
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.xs 
  },
  skipText: { 
    color: '#666', 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '500' 
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: LAYOUT.headerHeight + SPACING.sm,
    paddingHorizontal: responsiveWidth(5),
  },
  formContainer: { 
    width: '100%',
    maxWidth: isTablet ? responsiveWidth(80) : responsiveWidth(95),
    alignSelf: 'center',
  },
  inputGroup: { 
    marginBottom: isTablet ? SPACING.lg : SPACING.md 
  },
  rowContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  halfWidth: { 
    flex: 1,
      minWidth: 0,
  },
  label: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#333', 
    marginBottom: SPACING.xs, 
    fontWeight: '500' 
  },
  asterisk: { 
    color: '#d32f2f' 
  },
  input: {
    borderWidth: 1,
    borderColor: '#00203F',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    fontSize: responsiveText(FONT_SIZE.sm),
    backgroundColor: '#FFFFFF',
    color: '#333',
    minHeight: isTablet ? moderateScale(55) : moderateScale(48),
    justifyContent: 'center',
    ...LAYOUT.shadow.sm,
  },
  iosPickerTouchable: {
    justifyContent: 'center',
  },
  inputError: { 
    borderColor: '#d32f2f' 
  },
  errorText: { 
    color: '#d32f2f', 
    marginTop: SPACING.xs, 
    fontSize: responsiveText(FONT_SIZE.xs) 
  },

  footer: {
    position: 'absolute',
    left: responsiveWidth(5),
    right: responsiveWidth(5),
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  submitButton: {
    backgroundColor: '#00203F',
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    borderRadius: LAYOUT.borderRadius.lg,
    alignItems: 'center',
    ...LAYOUT.shadow.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: 'bold'
  },
  bottomSpacing: {
    height: SPACING.md,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#00203F',
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    ...LAYOUT.shadow.sm,
  },
  pickerContainerError: {
    borderColor: '#d32f2f',
  },
  picker: {
    height: isTablet ? moderateScale(55) : moderateScale(48),
    width: '100%',
    color: '#333',
  },
  pickerText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#999',
  },

  // Date modal (iOS)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  dateModalContent: {
    backgroundColor: '#fff',
    paddingBottom: SAFE_AREA.safeBottom + SPACING.base,
    borderTopLeftRadius: LAYOUT.borderRadius.lg,
    borderTopRightRadius: LAYOUT.borderRadius.lg,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomColor: '#E0E0E0',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCancel: {
    color: '#007aff',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  modalDone: {
    color: '#007aff',
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
  },
  datePickerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal styles for Android fallback (pickers)
  modalContent: {
    backgroundColor: '#fff',
    paddingBottom: SAFE_AREA.safeBottom + SPACING.base,
    borderTopLeftRadius: LAYOUT.borderRadius.lg,
    borderTopRightRadius: LAYOUT.borderRadius.lg,
    maxHeight: responsiveHeight(40),
  },
  modalHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  modalPickerWrap: {
    paddingHorizontal: 0,
  },
});

export default AddFamily;