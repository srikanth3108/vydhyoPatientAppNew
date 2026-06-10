import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   SafeAreaView,
//   ScrollView,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { RootStackParamList } from '../../navigation/navigationTypes';

// // Define navigation prop type
// type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TripHistory'>;

// const TripHistory: React.FC = () => {
//   const navigation = useNavigation<NavigationProp>();

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView>
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity
//             onPress={() => navigation.goBack()}
//             style={styles.backButton}
//           >
//             <Text style={styles.backArrow}>←</Text>
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>My Trip History</Text>
//         </View>

//         {/* First Trip */}
//         <View style={styles.tripCard}>
//           <View style={styles.tripHeader}>
//             <Text style={styles.dateTime}>12 July 2025, 10:42 AM</Text>
//             <View style={styles.status}>
//               <Text style={styles.statusText}>Completed</Text>
//             </View>
//           </View>
//           <Text style={styles.tripId}>Trip ID: AMB10293847</Text>

//           <View style={styles.location}>
//             <View style={styles.locationDotBlue} />
//             <Text style={styles.locationText}>Madhapur</Text>
//           </View>
//           <View style={styles.location}>
//             <View style={styles.locationDotRed} />
//             <Text style={styles.locationText}>Apollo Hospital, Jubilee Hills</Text>
//           </View>

//           <View style={styles.detailsSection}>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Ambulance Type:</Text>
//               <Text style={styles.detailValue}>ICU</Text>
//             </View>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Vehicle No.:</Text>
//               <Text style={styles.detailValue}>TS09-8723</Text>
//             </View>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Driver:</Text>
//               <Text style={styles.detailValue}>Rajesh Kumar</Text>
//             </View>
//           </View>

//           <View style={styles.metrics}>
//             <View style={styles.metric}>
//               <Text style={styles.metricLabel}>Distance</Text>
//               <Text style={styles.metricValue}>6.3 km</Text>
//             </View>
//             <View style={styles.metric}>
//               <Text style={styles.metricLabel}>Duration</Text>
//               <Text style={styles.metricValue}>14 min</Text>
//             </View>
//             <View style={styles.metric}>
//               <Text style={styles.metricLabel}>Fare</Text>
//               <Text style={styles.metricValue}>₹250</Text>
//             </View>
//           </View>

//           <View style={styles.actions}>
//             <TouchableOpacity style={styles.receiptBtn}>
//               <Text style={styles.actionBtnText}>📄 Receipt</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.routeBtn}>
//               <Text style={styles.actionBtnText}>🗺️ Route</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.rateBtn}>
//               <Text style={styles.actionBtnText}>⭐ Rate</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Second Trip */}
//         <View style={styles.tripCard}>
//           <View style={styles.tripHeader}>
//             <Text style={styles.dateTime}>8 July 2025, 11:20 AM</Text>
//             <View style={styles.status}>
//               <Text style={styles.statusText}>Completed</Text>
//             </View>
//           </View>
//           <Text style={styles.tripId}>Trip ID: AMB10293456</Text>

//           <View style={styles.location}>
//             <View style={styles.locationDotBlue} />
//             <Text style={styles.locationText}>Kondapur</Text>
//           </View>
//           <View style={styles.location}>
//             <View style={styles.locationDotRed} />
//             <Text style={styles.locationText}>Max Hospital, Gachibowli</Text>
//           </View>

//           <View style={styles.detailsSection}>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Ambulance Type:</Text>
//               <Text style={styles.detailValue}>Basic Life Support</Text>
//             </View>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Vehicle No.:</Text>
//               <Text style={styles.detailValue}>TS09-7641</Text>
//             </View>
//             <View style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Driver:</Text>
//               <Text style={styles.detailValue}>Suresh Reddy</Text>
//             </View>
//           </View>

//           <View style={styles.metrics}>
//             <View style={styles.metric}>
//               <Text style={styles.metricLabel}>Distance</Text>
//               <Text style={styles.metricValue}>3.8 km</Text>
//             </View>
//             <View style={styles.metric}>
//               <Text style={styles.metricLabel}>Duration</Text>
//               <Text style={styles.metricValue}>9 min</Text>
//             </View>
//             <View style={styles.metric}>
//               <Text style={styles.metricLabel}>Fare</Text>
//               <Text style={styles.metricValue}>₹300</Text>
//             </View>
//           </View>

//           <View style={styles.actions}>
//             <TouchableOpacity style={styles.receiptBtn}>
//               <Text style={styles.actionBtnText}>📄 Receipt</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.routeBtn}>
//               <Text style={styles.actionBtnText}>🗺️ Route</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.ratedBtn}>
//               <Text style={styles.actionBtnText}>⭐ Rated</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         <TouchableOpacity
//           style={styles.homeButton}
//           onPress={() => navigation.navigate('Home')}
//         >
//           <Text style={styles.homeIcon}>🏠</Text>
//           <Text style={styles.homeButtonText}>Go to Home</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#EDFFF7',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#EDFFF7',
//   },
//   backButton: {
//     marginRight: 16,
//     padding: 4,
//   },
//   backArrow: {
//     fontSize: 20,
//     color: '#333',
//     fontWeight: '400',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '500',
//     color: '#333',
//   },
//   tripCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 16,
//     marginHorizontal: 16,
//     marginTop: 16,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   tripHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   dateTime: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//   },
//   status: {
//     backgroundColor: '#e8f5e8',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: '500',
//     color: '#2d7d32',
//   },
//   tripId: {
//     fontSize: 12,
//     color: '#888',
//     marginBottom: 12,
//   },
//   location: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 6,
//   },
//   locationDotBlue: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#2196f3',
//     marginRight: 8,
//   },
//   locationDotRed: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#f44336',
//     marginRight: 8,
//   },
//   locationText: {
//     fontSize: 14,
//     color: '#333',
//   },
//   detailsSection: {
//     marginVertical: 16,
//     backgroundColor: '#FAFAFA',
//     borderRadius: 8,
//     padding: 12,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   detailLabel: {
//     fontSize: 13,
//     color: '#666',
//     flex: 1,
//   },
//   detailValue: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#333',
//     flex: 1,
//     textAlign: 'right',
//   },
//   metrics: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingVertical: 12,
//     borderTopWidth: 1,
//     borderBottomWidth: 1,
//     borderColor: '#eee',
//     marginVertical: 12,
//   },
//   metric: {
//     alignItems: 'center',
//   },
//   metricLabel: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 4,
//   },
//   metricValue: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//   },
//   actions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 12,
//     marginTop: 12,
//   },
//   actionBtnText: {
//     fontSize: 12,
//     fontWeight: '500',
//     textAlign: 'center',
//   },
//   receiptBtn: {
//     flex: 1,
//     backgroundColor: '#e3f2fd',
//     padding: 8,
//     borderRadius: 8,
//   },
//   routeBtn: {
//     flex: 1,
//     backgroundColor: '#f3e5f5',
//     padding: 8,
//     borderRadius: 8,
//   },
//   rateBtn: {
//     flex: 1,
//     backgroundColor: '#fff3e0',
//     padding: 8,
//     borderRadius: 8,
//   },
//   ratedBtn: {
//     flex: 1,
//     backgroundColor: '#fff9c4',
//     padding: 8,
//     borderRadius: 8,
//   },
//   homeButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#1976d2',
//     borderRadius: 8,
//     paddingVertical: 14,
//     marginHorizontal: 16,
//     marginVertical: 20,
//   },
//   homeIcon: {
//     fontSize: 16,
//     color: '#FFFFFF',
//     marginRight: 8,
//   },
//   homeButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#FFFFFF',
//   },
// });

// export default TripHistory;


import { useSelector } from 'react-redux';

type Lang = 'en' | 'hi' | 'tel';
const normalizeLang = (l?: string): Lang => {
  if (l === 'en' || l === 'hi' || l === 'tel') return l;
  if (l === 'te') return 'tel';
  return 'en';
};

const TR = {
  title: {
    en: 'Coming Soon',
    hi: 'जल्द आ रहा है',
    tel: 'త్వరలో రాబోతోంది',
  },
  subtitle: {
    en: 'This feature will be available soon.',
    hi: 'यह फ़ीचर जल्द ही उपलब्ध होगा।',
    tel: 'ఈ సౌకర్యం త్వరలో అందుబాటులో ఉంటుంది.',
  },
};

const BookingsComingSoon: React.FC = () => {
  const { currentUser } = useSelector((s: any) => s);
  const lang: Lang = normalizeLang(currentUser?.appLanguage);
  return (
    <SafeAreaView style={comingSoonStyles.container}>
      <View style={comingSoonStyles.centered}>
        <Text style={comingSoonStyles.icon}>🚧</Text>
        <Text style={comingSoonStyles.title}>{TR.title[lang]}</Text>
        <Text style={comingSoonStyles.subtitle}>{TR.subtitle[lang]}</Text>
      </View>
    </SafeAreaView>
  );
};

const comingSoonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDFFF7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1976d2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});

export default BookingsComingSoon;
