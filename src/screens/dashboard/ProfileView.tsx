import React, { useEffect, useState, useRef } from 'react';
import { AuthPut, ENDPOINTS } from '../../services';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ActionSheetIOS,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
;
import moment from 'moment';

// Responsive utils
import {
  SPACING,
  FONT_SIZE,
  LAYOUT,
  responsiveWidth,
  responsiveHeight,
  responsiveText,
  moderateScale,
  isIOS,
  isAndroid,
  isTablet,
  SAFE_AREA,
} from '../../utils/responsive';

const genders = ['Male', 'Female', 'Other'];
const relations = ['parent', 'child', 'self', 'other'];

const ProfileView = () => {
  const dispatch = useDispatch();
  const currentUserDetails = useSelector((state: any) => state.currentUser);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [modalPickerVisible, setModalPickerVisible] = useState(false);
  const [modalPickerType, setModalPickerType] = useState<'gender' | 'relation' | null>(null);
  
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    mobile: '',
    gender: '',
    DOB: '',
    age: '',
    relationship: '',
    licenseNumber: '',
    experience: '',
    qualification: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (currentUserDetails) {
      let formattedDOB = '';
      if (currentUserDetails.DOB) {
        let date: Date | undefined;

        if (typeof currentUserDetails.DOB === 'string' && currentUserDetails.DOB.includes('-')) {
          const parts = currentUserDetails.DOB.split('-');
          if (parts.length === 3) date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else if (typeof currentUserDetails.DOB === 'string' && currentUserDetails.DOB.includes('/')) {
          const parts = currentUserDetails.DOB.split('/');
          if (parts.length === 3) date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else {
          date = new Date(currentUserDetails.DOB);
        }

        if (date && !isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          formattedDOB = `${day}-${month}-${year}`;
        } else {
          formattedDOB = currentUserDetails.DOB;
        }
      }

      setForm({
        firstname: currentUserDetails.firstname || '',
        lastname: currentUserDetails.lastname || '',
        mobile: currentUserDetails.mobile || '',
        gender: currentUserDetails.gender || '',
        DOB: formattedDOB,
        age: currentUserDetails.age || '',
        relationship: currentUserDetails.relationship || '',
        licenseNumber: currentUserDetails.licenseNumber || '',
        experience: currentUserDetails.experience || '',
        qualification: currentUserDetails.qualification || '',
      });
    }
  }, [currentUserDetails]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.firstname.trim()) newErrors.firstname = 'First name is required';
    else if (!/^[a-zA-Z\s]{2,50}$/.test(form.firstname.trim())) newErrors.firstname = 'First name must be 2-50 letters only';

    if (!form.lastname.trim()) newErrors.lastname = 'Last name is required';
    else if (!/^[a-zA-Z\s]{1,50}$/.test(form.lastname.trim())) newErrors.lastname = 'Last name must be 1-50 letters only';

    if (!form.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    else if (!/^\d{10}$/.test(form.mobile)) newErrors.mobile = 'Must be a valid 10-digit mobile number';

    if (!form.gender) newErrors.gender = 'Gender is required';
    else if (!genders.includes(form.gender)) newErrors.gender = 'Invalid gender selection';

    if (!form.DOB) newErrors.DOB = 'Date of birth is required';
    else if (!/^\d{2}-\d{2}-\d{4}$/.test(form.DOB)) newErrors.DOB = 'Invalid date format (DD-MM-YYYY)';

    if (!form.age) newErrors.age = 'Age is required';
    else if (!/^\d+$/.test(form.age) || parseInt(form.age, 10) < 0 || parseInt(form.age, 10) > 150)
      newErrors.age = 'Age must be a number between 0 and 150';

    if (!form.relationship) newErrors.relationship = 'Relationship is required';
    else if (!relations.includes(form.relationship)) newErrors.relationship = 'Invalid relationship selection';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateAge = (dob: Date) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age.toString();
  };

  // iOS Date Picker Handlers
  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      setShowDatePicker(true);
    } else {
      const seed = form.DOB ? moment(form.DOB, 'DD-MM-YYYY').toDate() : new Date();
      setTempDate(seed);
      setShowDateModal(true);
    }
  };

  const handleDateChangeAndroid = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event?.type !== 'set') return; // dismissed
    }
    if (selectedDate) {
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      const age = calculateAge(selectedDate);
      setForm(prev => ({ ...prev, DOB: formattedDate, age }));
      setErrors(prev => ({ ...prev, DOB: '', age: '' }));
    }
  };

  const confirmDateSelection = () => {
    const formattedDate = moment(tempDate).format('DD-MM-YYYY');
    const age = calculateAge(tempDate);
    setForm(prev => ({ ...prev, DOB: formattedDate, age }));
    setErrors(prev => ({ ...prev, DOB: '', age: '' }));
    setShowDateModal(false);
  };

  const cancelDateSelection = () => {
    setShowDateModal(false);
  };

  // iOS Picker Handlers
  const openPicker = (type: 'gender' | 'relation') => {
    if (Platform.OS === 'ios') {
      const options = type === 'gender'
        ? ['Male', 'Female', 'Other', 'Cancel']
        : ['parent', 'child', 'self', 'other', 'Cancel'];

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

  const handleChange = (name: string, value: string) => {
    let validatedValue = value;

    if (name === 'firstname' || name === 'lastname') {
      validatedValue = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (name === 'mobile') {
      validatedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'age') {
      validatedValue = value.replace(/\D/g, '');
    } else if (name === 'licenseNumber') {
      validatedValue = value.replace(/[^a-zA-Z0-9-]/g, '');
    } else if (name === 'experience') {
      validatedValue = value.replace(/\D/g, '');
    } else if (name === 'qualification') {
      validatedValue = value.replace(/[^a-zA-Z\s,]/g, '');
    }

    setForm(prev => ({ ...prev, [name]: validatedValue }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill all required fields correctly',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const payload = {
        firstname: form.firstname,
        lastname: form.lastname,
        mobile: form.mobile,
        gender: form.gender,
        DOB: form.DOB,
        age: form.age,
        relationship: form.relationship,
      };

      const response = await AuthPut(
        ENDPOINTS.UPDATE_PATIENT(currentUserDetails.userId),
        payload,
        token
      );

      if (response?.status === 'success') {
        const userData = response.data.data;
        dispatch({ type: 'currentUser', payload: userData });
        dispatch({ type: 'currentUserID', payload: userData.userId });

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile updated successfully',
          position: 'top',
          visibilityTime: 3000,
        });
        setEditingField(null);
      } else {
        throw new Error(response?.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.message || error?.message || 'Failed to update profile',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  const getDisplayName = (): string => {
    const firstName = form.firstname || 'User';
    const lastName = form.lastname || '';
    return `${firstName} ${lastName}`.trim();
  };

  const renderPickerField = (label: string, field: string, value: string, options: string[]) => {
    if (editingField === field) {
      if (Platform.OS === 'android') {
        return (
          <View style={[styles.pickerContainer, errors[field] && styles.pickerContainerError]}>
            <Picker
              style={styles.picker}
              selectedValue={value}
              onValueChange={(itemValue) => handleChange(field, itemValue)}
            >
              <Picker.Item label={`Select ${label}`} value="" />
              {options.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
        );
      } else {
        return (
          <TouchableOpacity
            style={[styles.input, errors[field] && styles.inputError, styles.iosPickerTouchable]}
            onPress={() => openPicker(field as 'gender' | 'relation')}
          >
            <Text style={value ? styles.pickerText : styles.pickerPlaceholder}>
              {value || `Select ${label}`}
            </Text>
          </TouchableOpacity>
        );
      }
    } else {
      return (
        <TouchableOpacity onPress={() => setEditingField(field)} style={styles.editTouchable}>
          <Text
            style={[
              styles.editText,
              (!value || String(value).includes('Add')) && styles.placeholderText
            ]}
          >
            {value || `Add ${label.toLowerCase()}`}
          </Text>
        </TouchableOpacity>
      );
    }
  };

  const renderDateField = (label: string, field: string) => {
    if (editingField === field) {
      return (
        <TouchableOpacity onPress={openDatePicker} style={styles.fullWidth}>
          <TextInput
            style={[styles.input, errors[field] && styles.inputError]}
            value={form.DOB}
            placeholder="DD-MM-YYYY"
            placeholderTextColor="#999"
            editable={false}
            pointerEvents="none"
          />
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={
                form.DOB
                  ? (() => {
                      const [d, m, y] = form.DOB.split('-').map(Number);
                      return new Date(y, (m || 1) - 1, d || 1);
                    })()
                  : new Date()
              }
              mode="date"
              display="spinner"
              onChange={handleDateChangeAndroid}
              maximumDate={new Date()}
            />
          )}
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity onPress={() => setEditingField(field)} style={styles.editTouchable}>
          <Text
            style={[
              styles.editText,
              (!form.DOB || String(form.DOB).includes('Add')) && styles.placeholderText
            ]}
          >
            {form.DOB || `Add ${label.toLowerCase()}`}
          </Text>
        </TouchableOpacity>
      );
    }
  };

  const renderInputField = (label: string, field: string, key: string) => {
    return editingField === field ? (
      <TextInput
        style={[styles.input, errors[key] && styles.inputError]}
        value={form[key] as string}
        onChangeText={(value) => handleChange(key, value)}
        placeholder={`Enter ${label}`}
        placeholderTextColor="#999"
        keyboardType={
          label === 'Contact Number' ? 'phone-pad' :
          label === 'Experience' || label === 'Age' ? 'numeric' : 'default'
        }
        maxLength={
          label === 'Contact Number' ? 10 :
          label === 'License Number' ? 20 :
          label === 'Experience' ? 2 :
          label === 'Qualification' ? 100 : undefined
        }
        editable={label !== 'Age'}
      />
    ) : (
      <TouchableOpacity onPress={() => setEditingField(field)} style={styles.editTouchable}>
        <Text
          style={[
            styles.editText,
            (!form[key] || String(form[key]).includes('Add')) && styles.placeholderText
          ]}
        >
          {form[key] || `Add ${label.toLowerCase()}`}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDetailRow = (label: string, field: string) => {
    const key = field === 'DOB' ? 'DOB' : field.toLowerCase();

    return (
      <View key={field} style={styles.detailRow}>
        <Text style={styles.label}>{label}</Text>
        
        <View style={styles.valueContainer}>
          {editingField === field ? (
            key === 'gender' ? (
              renderPickerField('Gender', 'gender', form.gender, genders)
            ) : key === 'relationship' ? (
              renderPickerField('Relation', 'relationship', form.relationship, relations)
            ) : key === 'DOB' ? (
              renderDateField('Date of Birth', 'DOB')
            ) : (
              renderInputField(label, field, key)
            )
          ) : (
            <TouchableOpacity onPress={() => setEditingField(field)} style={styles.editTouchable}>
              <Text
                style={[
                  styles.editText,
                  (!form[key] || String(form[key]).includes('Add')) && styles.placeholderText
                ]}
              >
                {form[key] || `Add ${label.toLowerCase()}`}
              </Text>
            </TouchableOpacity>
          )}

          {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
        </View>
      </View>
    );
  };

  if (!currentUserDetails) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header} />

          <View style={styles.profileSection}>
            <View style={styles.profileInfo}>
              <Text style={styles.nameLabel}>Name</Text>

              {editingField === 'Name' ? (
                <View style={styles.nameInputContainer}>
                  <TextInput
                    style={[styles.input, styles.nameInput, errors.firstname && styles.inputError]}
                    value={form.firstname}
                    onChangeText={(value) => handleChange('firstname', value)}
                    placeholder="First Name"
                    placeholderTextColor="#999"
                    maxLength={50}
                  />
                  <TextInput
                    style={[styles.input, styles.nameInput, errors.lastname && styles.inputError]}
                    value={form.lastname}
                    onChangeText={(value) => handleChange('lastname', value)}
                    placeholder="Last Name"
                    placeholderTextColor="#999"
                    maxLength={50}
                  />
                </View>
              ) : (
                <TouchableOpacity onPress={() => setEditingField('Name')} style={styles.editTouchable}>
                  <Text style={styles.profileName}>{getDisplayName()}</Text>
                </TouchableOpacity>
              )}

              {(errors.firstname || errors.lastname) && (
                <Text style={styles.errorText}>{errors.firstname || errors.lastname}</Text>
              )}

              {currentUserDetails?.specialization && (
                <Text style={styles.specializationText}>{currentUserDetails.specialization.name}</Text>
              )}
            </View>
          </View>

          <View style={styles.detailsContainer}>
            {renderDetailRow('Contact Number', 'mobile')}
            {renderDetailRow('Gender', 'gender')}
            {renderDetailRow('Date of Birth', 'DOB')}
            {renderDetailRow('Age', 'age')}
            {renderDetailRow('Emergency Contact', 'relationship')}

            {currentUserDetails?.userType === 'doctor' && (
              <>
                {renderDetailRow('License Number', 'licenseNumber')}
                {renderDetailRow('Experience', 'experience')}
                {renderDetailRow('Qualification', 'qualification')}
              </>
            )}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Update</Text>
          </TouchableOpacity>
        </ScrollView>

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

        {/* Android Modal Picker */}
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
                    <Picker.Item label="Select Gender" value="" />
                    <Picker.Item label="Male" value="Male" />
                    <Picker.Item label="Female" value="Female" />
                    <Picker.Item label="Other" value="Other" />
                  </Picker>
                ) : modalPickerType === 'relation' ? (
                  <Picker
                    selectedValue={form.relationship}
                    onValueChange={(value) => handleChange('relationship', value)}
                  >
                    <Picker.Item label="Select Relation" value="" />
                    <Picker.Item label="parent" value="parent" />
                    <Picker.Item label="child" value="child" />
                    <Picker.Item label="self" value="self" />
                    <Picker.Item label="other" value="other" />
                  </Picker>
                ) : null}
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#EDFFF7' 
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: { 
    flexGrow: 1, 
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg 
  },
  centerContent: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: { 
    height: LAYOUT.headerHeight,
    backgroundColor: '#EDFFF7' 
  },
  profileSection: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: SPACING.lg,
    backgroundColor: '#EDFFF7', 
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: '#E5E7EB' 
  },
  profileInfo: { 
    flex: 1 
  },
  nameLabel: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#666', 
    marginBottom: SPACING.xs 
  },
  profileName: { 
    fontSize: responsiveText(FONT_SIZE.xl), 
    fontWeight: '600', 
    color: '#333' 
  },
  nameInputContainer: { 
    flexDirection: 'row', 
    gap: SPACING.sm 
  },
  nameInput: { 
    flex: 1 
  },
  specializationText: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#007AFF', 
    marginTop: SPACING.xs, 
    fontWeight: '500' 
  },
  detailsContainer: { 
    flex: 1, 
    backgroundColor: '#EDFFF7', 
    paddingHorizontal: responsiveWidth(5) 
  },
  detailRow: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md, 
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: '#E5E7EB' 
  },
  label: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#333', 
    fontWeight: '500',
    flex: 1
  },
  valueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  editTouchable: {
    paddingVertical: SPACING.xs
  },
  editText: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#007AFF', 
    fontWeight: '400',
    textAlign: 'right'
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
    minHeight: LAYOUT.inputHeight,
    width: '100%',
  },
  inputError: { 
    borderColor: '#FF3B30' 
  },
  placeholderText: { 
    color: '#999', 
    fontStyle: 'italic' 
  },
  loadingText: { 
    fontSize: responsiveText(FONT_SIZE.md), 
    color: '#666' 
  },
  errorText: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#FF3B30', 
    marginTop: SPACING.xs,
    textAlign: 'right',
    width: '100%'
  },
  submitButton: { 
    backgroundColor: '#00203F', 
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg, 
    alignItems: 'center', 
    marginHorizontal: responsiveWidth(5), 
    marginTop: SPACING.xl, 
    marginBottom: SPACING.lg,
    ...LAYOUT.shadow.md
  },
  submitButtonText: { 
    color: '#fff', 
    fontSize: responsiveText(FONT_SIZE.md), 
    fontWeight: 'bold' 
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#00203F',
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    width: '100%',
  },
  pickerContainerError: {
    borderColor: '#FF3B30',
  },
  picker: {
    height: LAYOUT.inputHeight,
    width: '100%',
    color: '#333',
  },
  iosPickerTouchable: {
    justifyContent: 'center',
    minHeight: LAYOUT.inputHeight,
    width: '100%',
  },
  pickerText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#333',
    textAlign: 'right',
  },
  pickerPlaceholder: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#999',
    textAlign: 'right',
  },
  fullWidth: {
    width: '100%',
  },
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

export default ProfileView;