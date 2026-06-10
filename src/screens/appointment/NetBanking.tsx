import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/navigationTypes';

type NetBankingRouteProp = RouteProp<RootStackParamList, 'NetBanking'>;

interface NetBankingProps {
  route: NetBankingRouteProp;
}

const NetBanking: React.FC<NetBankingProps> = ({ route }) => {
  const { doctor, date, time, patient, amount } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleConfirm = () => {
    navigation.navigate('PaymentConfirmation', {
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Net Banking</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.amount}>Amount: ₹{amount}</Text>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Confirm Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDFFF7' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#EDFFF7' },
  backButton: { marginRight: 12, padding: 4 },
  backArrow: { fontSize: 24, color: '#333333', fontWeight: '300' },
  headerTitle: { fontSize: 18, fontWeight: '500', color: '#333333' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  amount: { fontSize: 20, color: '#333333', marginBottom: 20 },
  confirmButton: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 8 },
  confirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
});

export default NetBanking;