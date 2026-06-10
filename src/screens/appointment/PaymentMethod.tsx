import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';

type PaymentMethodRouteProp = RouteProp<RootStackParamList, 'PaymentMethod'>;

interface PaymentMethodProps {
  route: PaymentMethodRouteProp;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({ route }) => {
  const { doctor, date, time, patient, amount } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [savePaymentMethod, setSavePaymentMethod] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handlePayment = (method: string) => {
    switch (method) {
      case 'UPI':
        navigation.navigate('UPI', { doctor, date, time, patient, amount });
        break;
      case 'Credit/Debit Card':
        navigation.navigate('DebitCard', { doctor, date, time, patient, amount });
        break;
      case 'Net Banking':
        navigation.navigate('NetBanking', { doctor, date, time, patient, amount });
        break;
      case 'VU Wallet':
        navigation.navigate('Wallet', { doctor, date, time, patient, amount });
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Payment Method</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.paymentSection}>
          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => handlePayment('UPI')}
          >
            <View style={[styles.paymentIcon, { backgroundColor: '#E8D5FF' }]}>
              <Text style={styles.iconText}>📱</Text>
            </View>
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentTitle}>UPI Apps</Text>
              <Text style={styles.paymentSubtitle}>Pay with PhonePe, GPay, etc.</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => handlePayment('Credit/Debit Card')}
          >
            <View style={[styles.paymentIcon, { backgroundColor: '#D5E8FF' }]}>
              <Text style={styles.iconText}>💳</Text>
            </View>
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentTitle}>Debit / Credit card</Text>
              <Text style={styles.paymentSubtitle}>Visa, MasterCard, Rupay supported</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.paymentOption}
            onPress={() => handlePayment('Net Banking')}
          >
            <View style={[styles.paymentIcon, { backgroundColor: '#D5FFE8' }]}>
              <Text style={styles.iconText}>🏦</Text>
            </View>
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentTitle}>Net Banking</Text>
              <Text style={styles.paymentSubtitle}>Select from major Indian banks</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, styles.lastPaymentOption]}
            onPress={() => handlePayment('VU Wallet')}
          >
            <View style={[styles.paymentIcon, { backgroundColor: '#FFE8D5' }]}>
              <Text style={styles.iconText}>💰</Text>
            </View>
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentTitle}>VU Wallet</Text>
              <Text style={styles.paymentSubtitle}>Select from major Indian banks</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={() => setSavePaymentMethod(!savePaymentMethod)}
        >
          <View style={[styles.checkbox, savePaymentMethod && styles.checkboxChecked]}>
            {savePaymentMethod && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxText}>Save payment method for future use</Text>
        </TouchableOpacity>

        <View style={styles.securitySection}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>Payments secured by RazorPay</Text>
        </View>
      </ScrollView>
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
    paddingVertical: 16,
    backgroundColor: '#EDFFF7',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  paymentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginVertical: 8,
  },
  lastPaymentOption: {
    borderBottomWidth: 0,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  arrow: {
    fontSize: 20,
    color: '#CCCCCC',
    fontWeight: '300',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderRadius: 4,
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
  checkboxText: {
    fontSize: 14,
    color: '#666666',
  },
  securitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 20,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#999999',
  },
});

export default PaymentMethod;