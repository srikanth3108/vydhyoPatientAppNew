import React, { useState, useRef } from 'react';
import { AuthPut, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
;
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';

// Import responsive utilities
import {
  responsiveWidth,
  responsiveHeight,
  responsiveText,
  moderateScale,
  SPACING,
  FONT_SIZE,
  LAYOUT,
  isTablet,
  isIOS,
  isAndroid,
  SAFE_AREA,
} from '../../utils/responsive';

type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
};

type Lang = 'en' | 'hi' | 'tel';

const select = {
  en: {
    skip: 'Skip',
    firstNameLabel: 'First Name *',
    firstNamePlaceholder: 'Enter your First Name',
    firstNameRequired: 'First Name is required',
    firstNameInvalid: 'First Name should contain only letters (2-30 characters)',

    lastNameLabel: 'Last Name *',
    lastNamePlaceholder: 'Enter your Last Name',
    lastNameRequired: 'Last Name is required',
    lastNameInvalid: 'Last Name should contain only letters (1-20 characters)',

    dobLabel: 'Date of Birth',
    dobPlaceholder: 'DD/MM/YYYY',
    // dobRequired: 'Date of Birth is required',
    dobInvalidFormat: 'Please enter a valid date in DD/MM/YYYY format',
    dobInvalidDate: 'Please enter a valid date',

    ageLabel: 'Age *',
    agePlaceholder: 'e.g., 3d, 4m, 6y',
    ageRequired: 'Age is required',
    ageInvalid: 'Please enter valid age (e.g., 3d, 4m, 6y)',

    genderLabel: 'Gender *',
    genderPlaceholder: 'Select',
    genderRequired: 'Gender is required',
    genderMale: 'Male',
    genderFemale: 'Female',
    genderOther: 'Other',
    // genderPreferNot: 'Prefer not to say',

    // emailLabel: 'Email ID *',
    emailPlaceholder: 'Enter your Email Id',
    emailRequired: 'Email ID is required',
    emailInvalid: 'Please enter a valid email address',

    submit: 'Submit',
    requiredHint: '* indicates required field',

    alertSuccessTitle: 'Success',
    alertSuccessBody: 'Profile updated successfully!',
    alertErrorTitle: 'Error',
    alertErrorBody: 'Failed to update profile. Please try again.',
  },
  hi: {
    skip: 'छोड़ें',
    firstNameLabel: 'पहला नाम *',
    firstNamePlaceholder: 'अपना पहला नाम दर्ज करें',
    firstNameRequired: 'पहला नाम आवश्यक है',
    firstNameInvalid: 'पहला नाम केवल अक्षरों का हो (2–30 वर्ण)',

    lastNameLabel: 'उपनाम *',
    lastNamePlaceholder: 'अपना उपनाम दर्ज करें',
    lastNameRequired: 'उपनाम आवश्यक है',
    lastNameInvalid: 'उपनाम केवल अक्षरों का हो (1–20 वर्ण)',

    dobLabel: 'जन्म तिथि',
    dobPlaceholder: 'DD/MM/YYYY',
    dobInvalidFormat: 'कृपया DD/MM/YYYY प्रारूप में मान्य तिथि दर्ज करें',
    dobInvalidDate: 'कृपया मान्य तिथि दर्ज करें',

    ageLabel: 'उम्र *',
    agePlaceholder: 'जैसे, 3d, 4m, 6y',
    ageRequired: 'उम्र आवश्यक है',
    ageInvalid: 'कृपया मान्य उम्र दर्ज करें (जैसे, 3d, 4m, 6y)',

    genderLabel: 'लिंग *',
    genderPlaceholder: 'चुनें',
    genderRequired: 'लिंग आवश्यक है',
    genderMale: 'पुरुष',
    genderFemale: 'महिला',
    genderOther: 'अन्य',
    // genderPreferNot: 'नहीं बताना चाहते',

    // emailLabel: 'ईमेल आईडी *',
    emailPlaceholder: 'अपना ईमेल दर्ज करें',
    emailRequired: 'ईमेल आवश्यक है',
    emailInvalid: 'कृपया मान्य ईमेल पता दर्ज करें',

    submit: 'जमा करें',
    requiredHint: '* अनिवार्य फ़ील्ड',

    alertSuccessTitle: 'सफलता',
    alertSuccessBody: 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!',
    alertErrorTitle: 'त्रुटि',
    alertErrorBody: 'प्रोफ़ाइल अपडेट नहीं हो सकी। कृपया पुनः प्रयास करें।',
  },
  tel: {
    skip: 'దాటివేయి',
    firstNameLabel: 'మొదటి పేరు *',
    firstNamePlaceholder: 'మీ మొదటి పేరు ఇవ్వండి',
    firstNameRequired: 'మొదటి పేరు అవసరం',
    firstNameInvalid: 'మొదటి పేరు అక్షరాలు మాత్రమే (2–30) ఉండాలి',

    lastNameLabel: 'ఇంటిపేరు *',
    lastNamePlaceholder: 'మీ ఇంటిపేరు ఇవ్వండి',
    lastNameRequired: 'ఇంటిపేరు అవసరం',
    lastNameInvalid: 'ఇంటిపేరు అక్షరాలు మాత్రమే (1–20) ఉండాలి',

    dobLabel: 'జన్మతేది',
    dobPlaceholder: 'DD/MM/YYYY',
    dobRequired: 'జన్మతేది అవసరం',
    dobInvalidFormat: 'దయచేసి DD/MM/YYYY రూపంలో సరైన తేదీ ఇవ్వండి',
    dobInvalidDate: 'దయచేసి సరైన తేదీ ఇవ్వండి',

    ageLabel: 'వయస్సు *',
    agePlaceholder: 'ఉదా., 3d, 4m, 6y',
    ageRequired: 'వయస్సు అవసరం',
    ageInvalid: 'దయచేసి సరైన వయస్సు ఇవ్వండి (ఉదా., 3d, 4m, 6y)',

    genderLabel: 'లింగం *',
    genderPlaceholder: 'ఎంచుకోండి',
    genderRequired: 'లింగం అవసరం',
    genderMale: 'పురుషుడు',
    genderFemale: 'స్త్రీ',
    genderOther: 'ఇతరులు',
    // genderPreferNot: 'చెప్పదలచుకోలేదు',

    // emailLabel: 'ఇమెయిల్ ఐడి *',
    emailPlaceholder: 'మీ ఇమెయిల్ నమోదు చేయండి',
    emailRequired: 'ఇమెయిల్ అవసరం',
    emailInvalid: 'దయచేసి సరైన ఇమెయిల్ చిరునామా ఇవ్వండి',

    submit: 'సమర్పించండి',
    requiredHint: '* తప్పనిసరి ఫీల్డ్',

    alertSuccessTitle: 'విజయం',
    alertSuccessBody: 'ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది!',
    alertErrorTitle: 'లోపం',
    alertErrorBody: 'ప్రొఫైల్ నవీకరణ విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
  },
} as const;

const normalizeLang = (val: any): Lang => {
  const s = String(val || '').toLowerCase();
  if (s === 'hi' || s === 'hindi') return 'hi';
  if (s === 'tel' || s === 'te' || s === 'telugu') return 'tel';
  return 'en';
};

const Profile = () => {
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const language: Lang = normalizeLang(currentuserDetails?.appLanguage || 'en');
  const t = (k: keyof typeof select['en']) => select[language][k];

  const dispatch = useDispatch();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'  | ''>('');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const scrollViewRef = useRef<ScrollView>(null);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const ageRef = useRef<TextInput>(null);

  // Localized gender options (labels shown to user, canonical values sent to API)
  const genderOptions = [
    { value: 'Male', label: t('genderMale') },
    { value: 'Female', label: t('genderFemale') },
    { value: 'Other', label: t('genderOther') },
  ];

  // Show label for current selection
  const currentGenderLabel =
    genderOptions.find((g) => g.value === gender)?.label || '';

  // Only letters, spaces, hyphens, apostrophes
  const validateName = (text: string) => /^[a-zA-Z\s\-']*$/.test(text);

  const validateAge = (ageText: string): boolean => {
    const ageRegex = /^(\d+)([dmy])$/i;
    return ageRegex.test(ageText.trim());
  };

  const calculateAgeFromDOB = (dob: string): string => {
    if (!dob) return '';
    
    const dobRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/;
    if (!dobRegex.test(dob)) return '';

    const [dd, mm, yyyy] = dob.split('/').map((p) => parseInt(p, 10));
    const dobDate = new Date(yyyy, mm - 1, dd);
    const today = new Date();

    // Check if date is valid
    if (
      dobDate.getFullYear() !== yyyy ||
      dobDate.getMonth() !== mm - 1 ||
      dobDate.getDate() !== dd
    ) {
      return '';
    }

    const diffTime = Math.abs(today.getTime() - dobDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays}d`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}m`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years}y`;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = t('firstNameRequired');
    } else if (!/^[a-zA-Z\s\-']{2,30}$/.test(firstName.trim())) {
      newErrors.firstName = t('firstNameInvalid');
    }

    if (!lastName.trim()) {
      newErrors.lastName = t('lastNameRequired');
    } else if (!/^[a-zA-Z\s\-']{1,20}$/.test(lastName.trim())) {
      newErrors.lastName = t('lastNameInvalid');
    }

    if (!age.trim()) {
      newErrors.age = t('ageRequired');
    } else if (!validateAge(age)) {
      newErrors.age = t('ageInvalid');
    }
    if (dateOfBirth.trim()) {
      const dobRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/;
      if (!dobRegex.test(dateOfBirth)) {
        newErrors.dateOfBirth = t('dobInvalidFormat');
      } else {
        const [dd, mm, yyyy] = dateOfBirth.split('/').map((p) => parseInt(p, 10));
        const dateObj = new Date(yyyy, mm - 1, dd);
        if (
          dateObj.getFullYear() !== yyyy ||
          dateObj.getMonth() !== mm - 1 ||
          dateObj.getDate() !== dd
        ) {
          newErrors.dateOfBirth = t('dobInvalidDate');
        }
      }
    }

    if (!gender) newErrors.gender = t('genderRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const calculateAge = (dateString: string) => {
      if (!dateString) return '0';
      const parts = dateString.split('/');
      if (parts.length !== 3) return '0';
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const dob = new Date(year, month, day);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age.toString();
    };

    if (validateForm()) {
      try {
        const parts = (dateOfBirth || '').split('/');
        const dobForApi =
          parts.length === 3
            ? `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`
            : '';

        const payload = {
          firstname: firstName,
          lastname: lastName,
          gender: gender, // canonical English value
          age: age, 
          DOB: dobForApi, // DD-MM-YYYY
          mobile: currentuserDetails?.mobile,
          familyProvider: currentuserDetails?.userId,
          relationship: 'self',
        };

        const token = await AsyncStorage.getItem('authToken');
        const response = await AuthPut(
          ENDPOINTS.UPDATE_PATIENT(currentuserDetails?.userId),
          payload,
          token
        );

        if (response?.status === 'success') {
          const userData = response?.data?.data;
          const id = userData?.userId;
          dispatch({ type: 'currentUser', payload: userData });
          dispatch({ type: 'currentUserID', payload: id });
          Alert.alert(t('alertSuccessTitle'), t('alertSuccessBody'));
          navigation.navigate('Home');
        } else {
          throw new Error(response?.message || 'Failed');
        }
      } catch (error) {
        Alert.alert(t('alertErrorTitle'), t('alertErrorBody'));
      }
    }
  };

  const handleSkip = () => navigation.navigate('Home');

  const selectGender = (selected: typeof gender) => {
    setGender(selected);
    setShowGenderDropdown(false);
    if (errors.gender) setErrors({ ...errors, gender: '' });
  };

  const onChangeDate = (event: any, date?: Date) => {
    if (event.type === 'set' && date) {
      setShowDatePicker(false);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();
      const formattedDOB = `${day}/${month}/${year}`;
      setDateOfBirth(formattedDOB);
      setSelectedDate(date);
      
      const calculatedAge = calculateAgeFromDOB(formattedDOB);
      if (calculatedAge) {
        setAge(calculatedAge);
        if (errors.age) setErrors({ ...errors, age: '' });
      }
      
      if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: '' });
    } else {
      setShowDatePicker(false);
    }
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      setShowDatePicker(true);
    } else {
      const seed = dateOfBirth ? moment(dateOfBirth, 'DD/MM/YYYY').toDate() : new Date();
      setTempDate(seed);
      setShowDateModal(true);
    }
    Keyboard.dismiss();
  };

  const confirmDateSelection = () => {
    const day = tempDate.getDate().toString().padStart(2, '0');
    const month = (tempDate.getMonth() + 1).toString().padStart(2, '0');
    const year = tempDate.getFullYear().toString();
    const formattedDOB = `${day}/${month}/${year}`;
    setDateOfBirth(formattedDOB);
    setSelectedDate(tempDate);
    
    const calculatedAge = calculateAgeFromDOB(formattedDOB);
    if (calculatedAge) {
      setAge(calculatedAge);
      if (errors.age) setErrors({ ...errors, age: '' });
    }
    
    if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: '' });
    setShowDateModal(false);
  };

  const cancelDateSelection = () => {
    setShowDateModal(false);
  };

  const handleNameChange = (text: string, field: 'firstName' | 'lastName') => {
    if (validateName(text) || text === '') {
      if (field === 'firstName') {
        setFirstName(text);
        if (errors.firstName) setErrors({ ...errors, firstName: '' });
      } else {
        setLastName(text);
        if (errors.lastName) setErrors({ ...errors, lastName: '' });
      }
    }
  };

  const handleAgeChange = (text: string) => {
    setAge(text);
    if (text.trim() && validateAge(text)) {
      if (errors.age) setErrors({ ...errors, age: '' });
    }
  };

  const handleInputFocus = (inputRef: React.RefObject<TextInput>) => {
    setTimeout(() => {
      inputRef.current?.measure((x, y, width, height, pageX, pageY) => {
        scrollViewRef.current?.scrollTo({
          y: pageY - 100, // Adjust this value as needed
          animated: true
        });
      });
    }, 300);
  };

  const inputStyle = (field: string) => [
    styles.input, 
    errors[field] ? styles.inputError : null
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Fixed Header */}
        <View style={styles.fixedHeader}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>{t('skip')}</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form */}
          <View style={styles.formContainer}>
            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('firstNameLabel')}</Text>
              <TextInput
                ref={firstNameRef}
                style={inputStyle('firstName')}
                value={firstName}
                onChangeText={(text) => handleNameChange(text, 'firstName')}
                placeholder={t('firstNamePlaceholder')}
                placeholderTextColor="#999"
                maxLength={30}
                onFocus={() => handleInputFocus(firstNameRef)}
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
              />
              {!!errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('lastNameLabel')}</Text>
              <TextInput
                ref={lastNameRef}
                style={inputStyle('lastName')}
                value={lastName}
                onChangeText={(text) => handleNameChange(text, 'lastName')}
                placeholder={t('lastNamePlaceholder')}
                placeholderTextColor="#999"
                maxLength={20}
                onFocus={() => handleInputFocus(lastNameRef)}
                returnKeyType="next"
                onSubmitEditing={() => ageRef.current?.focus()}
              />
              {!!errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            </View>

            {/* Date of Birth + Age */}
            <View style={styles.rowContainer}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>{t('ageLabel')}</Text>
                <TextInput
                  ref={ageRef}
                  style={inputStyle('age')}
                  value={age}
                  onChangeText={handleAgeChange}
                  placeholder={t('agePlaceholder')}
                  placeholderTextColor="#999"
                  maxLength={10}
                  onFocus={() => handleInputFocus(ageRef)}
                  returnKeyType="done"
                />
                {!!errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>{t('dobLabel')}</Text>
                <TouchableOpacity onPress={openDatePicker}>
                  <View style={[styles.input, errors.dateOfBirth ? styles.inputError : null]}>
                    <Text style={dateOfBirth ? styles.pickerText : styles.pickerPlaceholder}>
                      {dateOfBirth || t('dobPlaceholder')}
                    </Text>
                  </View>
                </TouchableOpacity>
                {!!errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}

                {/* Android Date Picker */}
                {showDatePicker && Platform.OS === 'android' && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={onChangeDate}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                  />
                )}
              </View>
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('genderLabel')}</Text>
              <TouchableOpacity
                style={[styles.input, errors.gender ? styles.inputError : null, styles.iosPickerTouchable]}
                onPress={() => {
                  setShowGenderDropdown(!showGenderDropdown);
                  Keyboard.dismiss();
                }}
              >
                <Text style={gender ? styles.pickerText : styles.pickerPlaceholder}>
                  {currentGenderLabel || t('genderPlaceholder')}
                </Text>
              </TouchableOpacity>
              {!!errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}

              {/* Gender Dropdown Modal */}
              <Modal
                visible={showGenderDropdown}
                transparent
                animationType="slide"
                onRequestClose={() => setShowGenderDropdown(false)}
              >
                <TouchableWithoutFeedback onPress={() => setShowGenderDropdown(false)}>
                  <View style={styles.modalBackdrop} />
                </TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Pressable onPress={() => setShowGenderDropdown(false)}>
                      <Text style={styles.modalCancel}>Cancel</Text>
                    </Pressable>
                  </View>
                  <View style={styles.modalPickerWrap}>
                    {genderOptions?.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.dropdownOption}
                        onPress={() => selectGender(option.value as typeof gender)}
                      >
                        <Text style={styles.dropdownOptionText}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </Modal>
            </View>

            {/* Submit Button */}
            <View style={styles.submitContainer}>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>{t('submit')}</Text>
              </TouchableOpacity>

              <Text style={styles.requiredText}>{t('requiredHint')}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* iOS Date Picker Modal */}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#EDFFF7' 
  },
  keyboardAvoid: { 
    flex: 1 
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
  scrollContainer: { 
    flexGrow: 1,
    paddingTop: LAYOUT.headerHeight + SPACING.sm,
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
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
  pickerText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#999',
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
  submitContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  submitButton: {
    backgroundColor: '#00203F',
    paddingVertical: isTablet ? SPACING.md : SPACING.sm,
    borderRadius: LAYOUT.borderRadius.lg,
    alignItems: 'center',
    ...LAYOUT.shadow.md,
  },
  submitButtonText: { 
    color: '#fff', 
    fontSize: responsiveText(FONT_SIZE.md), 
    fontWeight: 'bold' 
  },
  requiredText: { 
    textAlign: 'center', 
    marginTop: SPACING.sm, 
    fontSize: responsiveText(FONT_SIZE.xxs), 
    color: '#666' 
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
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
  dropdownOption: { 
    paddingHorizontal: SPACING.lg, 
    paddingVertical: SPACING.md, 
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: '#F3F4F6' 
  },
  dropdownOptionText: { 
    fontSize: responsiveText(FONT_SIZE.md), 
    color: '#333', 
    textAlign: 'center' 
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

  // Date modal (iOS)
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
  datePickerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Profile;