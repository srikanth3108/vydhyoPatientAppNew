// Routing/Routing.tsx
import React, { useEffect, useMemo } from 'react';
import { AuthFetch, ENDPOINTS } from '../services';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from './navigationTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from '../screens/auth/SplashScreen';
import LanguageSelection from '../screens/auth/LanguageSelection';
import Login from '../screens/auth/login';
import Register from '../screens/auth/Register';
import OtpVerification from '../screens/auth/OtpVerification';
import HomeScreen from '../screens/dashboard/HomeScreen';
import Profile from '../screens/dashboard/Profile';
import SelectIssue from '../screens/appointment/SelectIssue';
import FindDoctor from '../screens/appointment/FindDoctor';
import SelectClinic from '../screens/appointment/SelectClinic';
import DateSelection from '../screens/appointment/DateSelection';
import Appointment from '../screens/appointment/BookAppointment';
import Payment from '../screens/appointment/Payment';
import PaymentMethod from '../screens/appointment/PaymentMethod';
import UPI from '../screens/appointment/UPI';
import DebitCard from '../screens/appointment/CardDetails';
import NetBanking from '../screens/appointment/NetBanking';
import Wallet from '../screens/my-appointments/Wallet';
import BookingConfirmation from '../screens/appointment/BookingConfirmation';
import MyAppointments from '../screens/my-appointments/MyAppointments';
import ViewDetails from '../screens/my-appointments/ViewDetails';
import Reschedule from '../screens/my-appointments/Reschedule';
import Cancel from '../screens/my-appointments/Cancel';
import CancelConfirmation from '../screens/my-appointments/CancelConfirmation';
import AppointmentDetails from '../screens/my-appointments/AppointmentDetails';
import ReBook from '../screens/my-appointments/ReBook';
import CancelledAppointmentDetails from '../screens/my-appointments/CancelledAppointmentDetails';
import CancelAppointment from '../screens/appointment/CancelAppointment';
import AddFamily from '../screens/dashboard/AddFamily';
import Bookings from '../screens/sidebar/Bookings';
import FeedbackRating from '../screens/sidebar/FeedbackRating';
import HelpCenter from '../screens/sidebar/HelpCenter';
import MedicalReports from '../screens/sidebar/MedicalReports';
import MyDoctors from '../screens/sidebar/MyDoctors';
import MyFamily from '../screens/sidebar/MyFamily';
import Notifications from '../screens/sidebar/Notifications';
import Rewards from '../screens/sidebar/Rewards';
import Settings from '../screens/sidebar/Settings';
import WalletSideBar from '../screens/sidebar/WalletSideBar';
import MyOrders from '../screens/sidebar/MyOrders';
import OrderTracking from '../screens/sidebar/OrderTracking';
import CancelOrder from '../screens/sidebar/CancelOrder';
import ScheduleReturn from '../screens/sidebar/ScheduleReturn';
import ReturnConfirmation from '../screens/sidebar/ReturnConfirmation';
import BookAgain from '../screens/my-appointments/BookAgain';
import ProfileView from '../screens/dashboard/ProfileView';
import BookAmbulanceScreen from '../screens/ambulance/BookAmbulanceScreen';
import BloodBankScreen from '../screens/bloodbank/BloodBankScreen';
import FloatingAd from '../screens/dashboard/FloatingAd';
import ReferAndEarn from '../screens/sidebar/ReferAndEarn';
import DoctorDetails from '../screens/appointment/DoctorDetails';
import PinManagement from '../screens/auth/PinManagement';
import RentalCategories from '../screens/rentals/RentalCategories';
import RentalAgents from '../screens/rentals/RentalAgents';
import RentalsCatalog from '../screens/rentals/RentalsCatalog';
import RentalProductDetails from '../screens/rentals/RentalProductDetails';
import RentalAddress from '../screens/rentals/RentalAddress';
import RentalReviewPay from '../screens/rentals/RentalReviewPay';
import RentalOrderConfirmation from '../screens/rentals/RentalOrderConfirmation';
import SelectLocFromMap from '../screens/homeservices/legacy/SelectLocFromMap';
import HomeServiceProviders from '../screens/homeservices/core/HomeServiceProviders';
import ProviderDetailsScreen from '../screens/homeservices/core/ProviderDetailsScreen';
import HomeServiceOfferings from '../screens/homeservices/booking/HomeServiceOfferings';
import HomeServiceSlotSelection from '../screens/homeservices/booking/HomeServiceSlotSelection';
import HomeServiceReason from '../screens/homeservices/booking/HomeServiceReason';
import HomeServiceSelectPatient from '../screens/homeservices/booking/HomeServiceSelectPatient';
import HomeServiceReviewPay from '../screens/homeservices/booking/HomeServiceReviewPay';
import HomeServicePaymentGateway from '../screens/homeservices/booking/HomeServicePaymentGateway';
import HomeServicePaymentFailed from '../screens/homeservices/booking/HomeServicePaymentFailed';
import Physiotherapist from '../screens/homeservices/legacy/Physiotherapist';
import NursingCare from '../screens/homeservices/legacy/NursingCare';
import ReasonForConsultationScreen from '../screens/homeservices/legacy/ReasonForConsultation';
import SlotSelection from '../screens/homeservices/legacy/SlotSelection';
import SelectPatient from '../screens/homeservices/legacy/SelectPatient';
import HomeServiceBookingConfirmation from '../screens/homeservices/management/HomeServiceBookingConfirmation';
import HomeServiceCancel from '../screens/homeservices/management/HomeServiceCancel';
import HomeServiceCancelConfirmation from '../screens/homeservices/management/HomeServiceCancelConfirmation';
import HomeServiceReBook from '../screens/homeservices/management/HomeServiceReBook';
import HomeServices from '../screens/homeservices/core/HomeServices';
import HomeServiceAddress from '../screens/homeservices/booking/HomeServiceAddress';
import HomeAddress from '../screens/homeservices/legacy/HomeAddress';
import ConfirmToPay from '../screens/homeservices/legacy/ConfirmToPay';

const Stack = createNativeStackNavigator<RootStackParamList>();

type LangCode = 'en' | 'tel' | 'hi';

const strings: Record<LangCode, Record<string, string>> = {
  en: {
    addFamily: 'Add Family',
    medicalReports: 'Medical Reports',
    myDoctors: 'My Doctors',
    myFamily: 'My Family',
    bookAmbulance: 'Book Ambulance',
    bloodBank: 'Blood Bank',
    profile: 'Profile',
    selectYourLocation: 'Select Your Location',
    reasonForConsultation: 'Reason For Consultation',
    homeAddress: 'Home Address',
    slotSelection: 'Slot Selection',
    appointmentHeader: 'Appointment',
    reviewConfirmPay: 'Review & Confirm to pay',
    providers: 'Providers',
    services: 'Services',
    selectSlot: 'Select Slot',
    bookFor: 'Book For',
    reviewPay: 'Review & Pay',
  },
  tel: {
    addFamily: 'కుటుంబం జోడించండి',
    medicalReports: 'మెడికల్ రిపోర్ట్స్',
    myDoctors: 'నా డాక్టర్లు',
    myFamily: 'నా కుటుంబం',
    bookAmbulance: 'అంబులెన్స్ బుక్ చేయండి',
    bloodBank: 'బ్లడ్ బ్యాంక్',
    profile: 'ప్రొఫైల్',
    selectYourLocation: 'మీ స్థానం ఎంచుకోండి',
    reasonForConsultation: 'కన్సల్టేషన్ కారణం',
    homeAddress: 'ఇంటి చిరునామా',
    slotSelection: 'స్లాట్ ఎంపిక',
    appointmentHeader: 'అపాయింట్మెంట్',
    reviewConfirmPay: 'రివ్యూ చేసి చెల్లింపును నిర్ధారించండి',
    providers: 'ప్రొవైడర్లు',
    services: 'సేవలు',
    selectSlot: 'స్లాట్ ఎంపిక',
    bookFor: 'ఎవరి కోసం',
    reviewPay: 'రివ్యూ & చెల్లింపు',
  },
  hi: {
    addFamily: 'परिवार जोड़ें',
    medicalReports: 'मेडिकल रिपोर्ट्स',
    myDoctors: 'मेरे डॉक्टर्स',
    myFamily: 'मेरा परिवार',
    bookAmbulance: 'एंबुलेंस बुक करें',
    bloodBank: 'ब्लड बैंक',
    profile: 'प्रोफ़ाइल',
    selectYourLocation: 'अपना स्थान चुनें',
    reasonForConsultation: 'परामर्श का कारण',
    homeAddress: 'घर का पता',
    slotSelection: 'स्लॉट चयन',
    appointmentHeader: 'अपॉइंटमेंट',
    reviewConfirmPay: 'समीक्षा करें और भुगतान पुष्टि करें',
    providers: 'प्रदाता',
    services: 'सेवाएँ',
    selectSlot: 'स्लॉट चुनें',
    bookFor: 'किसके लिए',
    reviewPay: 'समीक्षा और भुगतान',
  },
};

export default function Routing() {
  const storedata = useSelector((s: any) => s);
  const currentUser = storedata.currentUser;
  const dispatch = useDispatch();

  const lang: LangCode = (['en', 'tel', 'hi'] as const).includes(currentUser?.appLanguage)
    ? currentUser.appLanguage
    : 'en';

  const t = useMemo(() => {
    const pack = strings[lang] || strings.en;
    return (key: string) => pack[key] ?? key;
  }, [lang]);

  // Deep linking configuration
  const linking = {
    prefixes: ['https://vydhyo.com/ref', 'vydhyopatientapp://refer'],
    config: {
      screens: {
        Register: ':code',
      },
    },
  };


  //here we need to call master currentwallet
  const fetchWalletData = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const userId = await AsyncStorage.getItem('userId');
    if ((!token || !userId)) {
      return;
    }
    try {
      const response = await AuthFetch(ENDPOINTS.GET_AVAILABLE_BALANCE(userId), token);
      console.log('finance/availablerouting', response);
      if (response.status === 'success') {
        const walletData = response.data.data
        console.log("walletData90", walletData)
        if (!walletData) return
        dispatch({ type: 'userWallet', payload: walletData });
      } else {
        console.error('Failed to fetch wallet data:', response);
      }
    } catch (error: any) {
      console.log('Error fetching wallet data:', error.message);
    }
  };

  useEffect(() => {
    fetchWalletData()
  }, [])
  console.log("storedata", storedata)

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LanguageSelection" component={LanguageSelection} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
        <Stack.Screen name="OtpVerification" component={OtpVerification} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={Profile} options={{ title: t('profile'), headerTitleAlign: 'center' }} />

        <Stack.Screen name="SelectIssue" component={SelectIssue} options={{ title: t('Select Issue'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="RentalCategories" component={RentalCategories} options={{ title: 'Rentals', headerTitleAlign: 'center' }} />
        <Stack.Screen name="RentalAgents" component={RentalAgents} options={{ title: 'Select Agent', headerTitleAlign: 'center' }} />
        <Stack.Screen name="RentalsCatalog" component={RentalsCatalog} options={{ title: 'Products', headerTitleAlign: 'center' }} />
        <Stack.Screen name="RentalProductDetails" component={RentalProductDetails} options={{ title: 'Product Details', headerTitleAlign: 'center' }} />
        <Stack.Screen name="RentalAddress" component={RentalAddress} options={{ title: 'Delivery Address', headerTitleAlign: 'center' }} />
        <Stack.Screen name="RentalReviewPay" component={RentalReviewPay} options={{ title: 'Review & Pay', headerTitleAlign: 'center' }} />
        <Stack.Screen name="RentalOrderConfirmation" component={RentalOrderConfirmation} options={{ headerShown: false }} />
        <Stack.Screen name="FindDoctor" component={FindDoctor} options={{ title: t('Find Doctors'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="SelectClinic" component={SelectClinic} options={{ title: t('Select Clinic'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="DateSelection" component={DateSelection} options={{ title: t('Select Time'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="Appointment" component={Appointment} options={{ title: t('Appointment'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="Payment" component={Payment} options={{ title: t('Complete Your Payment'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="PaymentMethod" component={PaymentMethod} options={{ headerShown: false }} />
        <Stack.Screen name="UPI" component={UPI} options={{ headerShown: false }} />
        <Stack.Screen name="DebitCard" component={DebitCard} options={{ headerShown: false }} />
        <Stack.Screen name="NetBanking" component={NetBanking} options={{ headerShown: false }} />
        <Stack.Screen name="Wallet" component={Wallet} options={{ title: t('Wallet'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="BookingConfirmation" component={BookingConfirmation} options={{ title: t('Booking Confirmation'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="MyAppointments" component={MyAppointments} options={{ title: t('My Appointments'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="ViewDetails" component={ViewDetails} options={{ title: t('Appointment Details'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="Reschedule" component={Reschedule} options={{ title: t('Reschedule'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="Cancel" component={Cancel} options={{ title: t('Cancel Appointment'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="CancelConfirmation" component={CancelConfirmation} options={{ headerShown: false }} />
        <Stack.Screen name="AppointmentDetails" component={AppointmentDetails} options={{ title: t('Appointment Details'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="ReBook" component={ReBook} options={{ title: t('Select Time'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="CancelledAppointmentDetails" component={CancelledAppointmentDetails} options={{ title: t('Appointment Details'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="CancelAppointment" component={CancelAppointment} options={{ headerShown: false }} />
        <Stack.Screen name="DoctorDetails" component={DoctorDetails} options={{ title: t('Doctor Details'), headerTitleAlign: 'center' }} />
        <Stack.Screen
          name="AddFamily"
          component={AddFamily}
          options={{ title: t('addFamily'), headerTitleAlign: 'center' }}
        />
        <Stack.Screen name="Bookings" component={Bookings} />
        <Stack.Screen name="FeedbackRating" component={FeedbackRating} options={{ title: t('Rate & Feedback'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="HelpCenter" component={HelpCenter} options={{ title: t('Help Center'), headerTitleAlign: 'center' }} />

        <Stack.Screen
          name="MedicalReports"
          component={MedicalReports}
          options={{ title: t('medicalReports'), headerTitleAlign: 'center' }}
        />
        <Stack.Screen
          name="MyDoctors"
          component={MyDoctors}
          options={{ title: t('myDoctors'), headerTitleAlign: 'center' }}
        />
        <Stack.Screen
          name="MyFamily"
          component={MyFamily}
          options={{ title: t('myFamily'), headerTitleAlign: 'center' }}
        />
        <Stack.Screen name="Notifications" component={Notifications} />

        <Stack.Screen name="Rewards" component={Rewards} options={{ title: t('Rewards'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="Settings" component={Settings}
          options={{ title: t('Settings'), headerTitleAlign: 'center' }}
        />
        <Stack.Screen name="WalletSideBar" component={WalletSideBar} options={{ headerShown: false }} />
        <Stack.Screen name="MyOrders" component={MyOrders} options={{ headerShown: false }} />
        <Stack.Screen name="OrderTracking" component={OrderTracking} options={{ headerShown: false }} />
        <Stack.Screen name="CancelOrder" component={CancelOrder} options={{ headerShown: false }} />
        <Stack.Screen name="ScheduleReturn" component={ScheduleReturn} options={{ headerShown: false }} />
        <Stack.Screen name="ReturnConfirmation" component={ReturnConfirmation} options={{ headerShown: false }} />
        <Stack.Screen name="BookAgain" component={BookAgain} options={{ title: t('Choose Appointment Mode'), headerTitleAlign: 'center' }} />

        <Stack.Screen
          name="BookAmbulanceScreen"
          component={BookAmbulanceScreen}
          options={{ title: t('bookAmbulance'), headerTitleAlign: 'center' }}
        />
        <Stack.Screen
          name="BloodBankScreen"
          component={BloodBankScreen}
          options={{ title: t('bloodBank'), headerTitleAlign: 'center' }}
        />
        <Stack.Screen
          name="ProfileView"
          component={ProfileView}
          options={{ title: t('profile'), headerTitleAlign: 'center' }}
        />
        <Stack.Screen name="FloatingAd" component={FloatingAd} />

        <Stack.Screen
          name="SelectLocFromMap"
          component={SelectLocFromMap}
          options={{ title: t('selectYourLocation'), headerTitleAlign: 'center' }}
        />

        <Stack.Screen name="HomeServices" component={HomeServices} options={{ title: t('Home Services'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="HomeServiceProviders" component={HomeServiceProviders} options={{ title: t('providers'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="ProviderDetails" component={ProviderDetailsScreen} options={{ title: 'Provider Details', headerTitleAlign: 'center' }} />
        <Stack.Screen name="HomeServiceOfferings" component={HomeServiceOfferings} options={{ title: t('services'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="HomeServiceSlotSelection" component={HomeServiceSlotSelection} options={{ title: t('selectSlot'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="HomeServiceReason" component={HomeServiceReason} options={{ title: t('reasonForConsultation'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="HomeServiceSelectPatient" component={HomeServiceSelectPatient} options={{ title: t('bookFor'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="HomeServiceAddress" component={HomeServiceAddress} options={{ title: t('homeAddress'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="HomeServiceReviewPay" component={HomeServiceReviewPay} options={{ title: t('reviewPay'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="HomeServicePaymentGateway" component={HomeServicePaymentGateway} options={{ headerShown: false }} />
        <Stack.Screen name="HomeServicePaymentFailed" component={HomeServicePaymentFailed} options={{ headerShown: false }} />
        <Stack.Screen name="Physiotherapist" component={Physiotherapist} options={{ title: t('Physiotherapist'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="NursingCare" component={NursingCare} options={{ headerShown: false }} />
        <Stack.Screen name="ReferAndEarn" component={ReferAndEarn} options={{ headerShown: false }} />

        <Stack.Screen
          name="ReasonForConsultation"
          component={ReasonForConsultationScreen}
          options={{ title: t('reasonForConsultation'), headerTitleAlign: 'center' }}
        />
        <Stack.Screen
          name="HomeAddress"
          component={HomeAddress}
          options={{ title: t('homeAddress'), headerTitleAlign: 'center' }}
        />
        <Stack.Screen
          name="SlotSelection"
          component={SlotSelection}
          options={{ title: t('slotSelection'), headerTitleAlign: 'center' }}
        />
        <Stack.Screen
          name="SelectPatient"
          component={SelectPatient}
          options={{ title: t('appointmentHeader'), headerTitleAlign: 'center' }}
        />
        <Stack.Screen
          name="ConfirmToPay"
          component={ConfirmToPay}
          options={{ title: t('reviewConfirmPay'), headerTitleAlign: 'center' }}
        />
        <Stack.Screen name="PinManagement" component={PinManagement}
          options={{ title: t('Pin Management'), headerTitleAlign: 'center' }} />
        <Stack.Screen name="HomeServiceBookingConfirmation" component={HomeServiceBookingConfirmation} options={{ headerShown: false }} />
        <Stack.Screen name="HomeServiceCancel" component={HomeServiceCancel} options={{ headerShown: false }} />
        <Stack.Screen name="HomeServiceCancelConfirmation" component={HomeServiceCancelConfirmation} options={{ headerShown: false }} />
        <Stack.Screen name="HomeServiceReBook" component={HomeServiceReBook} options={{ title: t('selectSlot'), headerTitleAlign: 'center' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
