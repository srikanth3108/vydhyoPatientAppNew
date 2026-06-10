import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';

// Import payment app logos (you'll need to add these images to your project)
const googlePayLogo = require('../../assets/gpay.png');
const phonePeLogo = require('../../assets/phonepe.jpg');
const paytmLogo = require('../../assets/paytm.png');
const bhimLogo = require('../../assets/bhim.png');
const amazonPayLogo = require('../../assets/amazonpay.png');

type UPIRouteProp = RouteProp<RootStackParamList, 'UPI'>;

interface UPIProps {
  route: UPIRouteProp;
}

const UPI: React.FC<UPIProps> = ({ route }) => {
  const { doctor, date, time, patient, amount } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handlePaymentMethod = (method: string) => {
    // Handle different payment methods
    console.log(`Selected payment method: ${method}`);
    // You can add specific logic for each payment method here
  };

  const handleManualUPI = () => {
    // Handle manual UPI ID entry
    console.log('Manual UPI ID entry selected');
    // navigation.navigate('ManualUPIEntry', { doctor, date, time, patient, amount });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const paymentMethods = [
    {
      id: 'googlepay',
      name: 'Google Pay',
      image: googlePayLogo,
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      image: phonePeLogo,
    },
    {
      id: 'paytm',
      name: 'Paytm',
      image: paytmLogo,
    },
    {
      id: 'bhim',
      name: 'BHIM',
      image: bhimLogo,
    },
    {
      id: 'amazonpay',
      name: 'Amazon Pay',
      image: amazonPayLogo,
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F8FF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pay via UPI</Text>
          <Text style={styles.headerSubtitle}>Choose your preferred UPI app</Text>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={styles.content}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={styles.paymentOption}
            onPress={() => handlePaymentMethod(method.id)}
          >
            <Image 
              source={method.image} 
              style={styles.paymentIcon} 
              resizeMode="contain"
            />
            <Text style={styles.paymentMethodText}>{method.name}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Manual UPI Entry */}
        <TouchableOpacity
          style={styles.manualUPIOption}
          onPress={handleManualUPI}
        >
          {/* <Image 
            source={upiLogo} 
            style={styles.paymentIcon} 
            resizeMode="contain"
          /> */}
          <Text style={styles.paymentMethodText}>Enter UPI ID manually</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.securityIndicator}>
          <Text style={styles.securityIcon}>🛡</Text>
          <Text style={styles.securityText}>Transaction secured by Razorpay</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F0F8FF',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backArrow: {
    fontSize: 24,
    color: '#333333',
    fontWeight: '300',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    marginRight: 16,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 18,
    color: '#CCCCCC',
    fontWeight: '300',
  },
  manualUPIOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#F0F8FF',
  },
  securityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
});

export default UPI;