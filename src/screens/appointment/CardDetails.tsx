import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity, 
  TextInput,
  Image,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';

type DebitCardRouteProp = RouteProp<RootStackParamList, 'DebitCard'>;

interface DebitCardProps {
  route: DebitCardRouteProp;
}

const DebitCard: React.FC<DebitCardProps> = ({ route }) => {
  const { doctor, date, time, patient, amount } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [otp, setOtp] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [cardType, setCardType] = useState<string | null>(null);
  const [showOtpField, setShowOtpField] = useState(false);

  useEffect(() => {
    if (cvv.length === 3 || cvv.length === 4) {
      setShowOtpField(true);
    } else {
      setShowOtpField(false);
    }
  }, [cvv]);

  useEffect(() => {
    // Detect card type based on card number
    const cleanedNumber = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleanedNumber)) {
      setCardType('visa');
    } else if (/^5[1-5]/.test(cleanedNumber)) {
      setCardType('mastercard');
    } else if (/^3[47]/.test(cleanedNumber)) {
      setCardType('amex');
    } else if (/^6(?:011|5)/.test(cleanedNumber)) {
      setCardType('discover');
    } else if (/^35(?:2[89]|[3-8][0-9])/.test(cleanedNumber)) {
      setCardType('jcb');
    } else if (/^9/.test(cleanedNumber)) {
      setCardType('rupay');
    } else {
      setCardType(null);
    }
  }, [cardNumber]);

  const handleConfirm = () => {
    navigation.navigate('BookingConfirmation', {
      appointmentDetails: {
        doctor: doctor.name,
        specialty: doctor.specialty,
        date,
        time,
        patient,
        amount,
      },
    });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      const formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
      setExpiryDate(formatted);
    } else {
      setExpiryDate(cleaned);
    }
  };

  // const getCardIcon = () => {
  //   switch (cardType) {
  //     case 'visa':
  //       return require('../../assets/card-icons/visa.png');
  //     case 'mastercard':
  //       return require('../../assets/card-icons/mastercard.png');
  //     case 'amex':
  //       return require('../../assets/card-icons/amex.png');
  //     case 'discover':
  //       return require('../../assets/card-icons/discover.png');
  //     case 'jcb':
  //       return require('../../assets/card-icons/jcb.png');
  //     case 'rupay':
  //       return require('../../assets/card-icons/rupay.png');
  //     default:
  //       return null;
  //   }
  // };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8F5E8" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay with Debit/Credit Card</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Card Number"
            placeholderTextColor="#A0A0A0"
            value={cardNumber}
            onChangeText={formatCardNumber}
            keyboardType="numeric"
            maxLength={19}
          />
          {cardType && (
            <View style={styles.cardIconContainer}>
              {/* <Image 
                source={getCardIcon()} 
                style={styles.cardIcon} 
                resizeMode="contain"
              /> */}
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Cardholder Name"
            placeholderTextColor="#A0A0A0"
            value={cardholderName}
            onChangeText={setCardholderName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.rowContainer}>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <TextInput
              style={styles.input}
              placeholder="MM/YY"
              placeholderTextColor="#A0A0A0"
              value={expiryDate}
              onChangeText={formatExpiryDate}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
          <View style={[styles.inputContainer, styles.halfWidth]}>
            <TextInput
              style={styles.input}
              placeholder="CVV"
              placeholderTextColor="#A0A0A0"
              value={cvv}
              onChangeText={setCvv}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>

        {showOtpField && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              placeholderTextColor="#A0A0A0"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
        )}

        <TouchableOpacity 
          style={styles.checkboxContainer} 
          onPress={() => setSaveCard(!saveCard)}
        >
          <View style={[styles.checkbox, saveCard && styles.checkboxChecked]}>
            {saveCard && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>Save card for future use</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.securityContainer}>
          <View style={styles.lockIcon}>
            <Text style={styles.lockText}>🔒</Text>
          </View>
          <Text style={styles.securityText}>Secured by Razorpay</Text>
        </View>

        <TouchableOpacity 
          style={[styles.payButton, (!otp && showOtpField) ? styles.payButtonDisabled : null]} 
          onPress={handleConfirm}
          disabled={showOtpField && !otp}
        >
          <Text style={styles.payButtonText}>Pay ₹{amount || '2,499'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDFFF7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EDFFF7',
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: '#333333',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    borderRadius: 3,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#666666',
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  securityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockIcon: {
    marginRight: 8,
  },
  lockText: {
    fontSize: 16,
  },
  securityText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  payButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardIconContainer: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  cardIcon: {
    width: 40,
    height: 25,
  },
});

export default DebitCard;