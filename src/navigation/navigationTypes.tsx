export type RootStackParamList = {
  Splash: undefined;
  LanguageSelection: undefined;
  Login: undefined;
  Register: undefined;
  OtpVerification: { mobile: string; userId: string };
  Home: undefined;
  Profile: undefined;
  FloatingAd: undefined;
  SelectIssue: undefined;
  HomeServices: undefined;
  RentalCategories: undefined;
  RentalAgents: { categoryId: string };
  RentalsCatalog: { categoryId?: string; agentId?: string } | undefined;
  RentalProductDetails: { productId: string };
  RentalAddress: {
    productId: string;
    billingUnit: 'hours' | 'days' | 'months';
    quantity: number;
    baseAmount: number;
  };
  RentalReviewPay: {
    productId: string;
    billingUnit: 'hours' | 'days' | 'months';
    quantity: number;
    baseAmount: number;
    address: {
      fullName: string;
      phone: string;
      building: string;
      street: string;
      landmark?: string;
      pincode: string;
      cityState: string;
    };
  };
  RentalOrderConfirmation: { orderId: string };
  MyOrders: undefined;
  OrderTracking: { orderId: string };
  CancelOrder: { orderId: string };
  ScheduleReturn: { orderId: string };
  ReturnConfirmation: { orderId: string };
  HomeServiceProviders: { categoryId: string };
  ProviderDetails: { providerId: string; categoryId: string };
  HomeServiceOfferings: { providerId: string; categoryId: string };
  HomeServiceSlotSelection: {
    providerId: string;
    categoryId: string;
  };
  HomeServiceReason: {
    providerId: string;
    categoryId: string;
    date: string;
    time: string;
  };
  HomeServiceSelectPatient: {
    providerId: string;
    categoryId: string;
    date: string;
    time: string;
    reason: string;
  };
  HomeServiceAddress: {
    providerId: string;
    categoryId: string;
    date: string;
    time: string;
    reason: string;
    patient: object;
  };
  HomeServiceReviewPay: {
    providerId: string;
    categoryId: string;
    date: string;
    time: string;
    reason: string;
    patient: object;
    formData: {
      building: string;
      floorFlat?: string;
      street: string;
      landmark?: string;
      pincode: string;
      cityState: string;
    };
  };
  HomeServicePaymentGateway: {
    payment_session_id: string;
    order_id: string;
    categoryId: string;
    providerId: string;
    date: string;
    time: string;
    patient: object;
    address: object;
    reason: string;
    appointmentDetails: {
      appointmentId: string;
      platformFee: number;
      amount?: number;
    };
  };
  HomeServicePaymentFailed: {
    appointmentDetails: object;
    categoryId: string;
    providerId: string;
    date: string;
    time: string;
    patient: object;
    address: object;
    reason: string;
    paymentSessionId: string;
    orderId: string;
    errorType: string;
    errorMessage: string;
  };
  Physiotherapist: { serviceType: string };
  NursingCare: undefined;
  FindDoctor: { specialty: string };
  ReferAndEarn:undefined;
  SelectLocFromMap:undefined;
  SelectClinic: {
    doctor: {
      id: number;
      doctorId?: number;
      name: string;
      specialty: string;
      consultationFee: any;
      addresses?: any;
    };
  };
DoctorDetails: { doctorId: string; selectedClinicId?: string | null }; 
PinManagement: { action?: 'set' | 'change' | 'forgot'; phoneNumber?: string };
DateSelection: {
  doctor: {
    id: number;
    name: string;
    specialty: string;
    consultationFee: number;
  };
  clinic?: {
    name: string;
    address: string;
    city: string;
  };
};
  Appointment: {
    doctor: {
      id: number;
      name: string;
      specialty: string;
      consultationFee: number;
    };
    date: string;
    time: string;
    newMember?: {
      id: string;
      name: string;
      relation: string;
      phone: string;
      initials: string;
      bgColor: string;
      textColor: string;
    };
  };
  MyFamily: {
    newMember?: {
      id: string;
      name: string;
      relation: string;
      phone: string;
      initials: string;
      bgColor: string;
      textColor: string;
    };
  };
  CancelAppointment: {
    appointmentDetails: {
      patientName: string;
      doctor: string;
      specialty: string;
      mode: string;
      clinic: string;
      address: string;
      dateTime: string;
      duration: string;
      consultationFee: number;
    };
  };
  Payment: {
    doctor: {
      id: number;
      name: string;
      specialty: string;
      consultationFee: number;
    };
    date: string;
    time: string;
    patient: string;
  };
  PaymentMethod: {
    doctor: {
      id: number;
      name: string;
      specialty: string;
      consultationFee: number;
    };
    date: string;
    time: string;
    patient: string;
    amount: number;
  };
  UPI: {
    doctor: {
      id: number;
      name: string;
      specialty: string;
      consultationFee: number;
    };
    date: string;
    time: string;
    patient: string;
    amount: number;
  };
  DebitCard: {
    doctor: {
      id: number;
      name: string;
      specialty: string;
      consultationFee: number;
    };
    date: string;
    time: string;
    patient: string;
    amount: number;
  };
  NetBanking: {
    doctor: {
      id: number;
      name: string;
      specialty: string;
      consultationFee: number;
    };
    date: string;
    time: string;
    patient: string;
    amount: number;
  };
  Wallet: {
    doctor: { name: string; specialty: string };
    date: string;
    time: string;
    patient: string;
    amount: number;
  };
  PaymentConfirmation: {
    appointmentDetails: {
      doctor: string;
      specialty: string;
      date: string;
      time: string;
      patient: string;
      amount: number;
    };
  }
  BookingConfirmation: {
    orderID: string;
    platformFee: number;
    selectedOption: string | null;
  };
  MyAppointments: undefined;
  AppointmentDetails: { appointment: UpcomingAppointment | CompletedAppointment | CancelledAppointment };
  ViewDetails: { appointment: UpcomingAppointment | CompletedAppointment | CancelledAppointment };
  orderID: { orderID: string};
  Reschedule: { appointment: UpcomingAppointment };
  Cancel: { appointment: UpcomingAppointment };
  CancelConfirmation: {
    appointment: UpcomingAppointment;
    reason?: string;
  };
  ReBook: { appointment: CancelledAppointment };
  CancelledAppointmentDetails: { appointment: CancelledAppointment };
  AddFamily: undefined;
  Bookings: undefined;
  MyDoctors: undefined;
  MedicalReports: undefined;
  Notifications: undefined;
  Rewards: undefined;
  FeedbackRating: undefined;
  HelpCenter: undefined;
  Settings: undefined;
  WalletSideBar:undefined;
  ProfileView:undefined;
  BookAgain: { appointment: CompletedAppointment | CancelledAppointment };
  BookAmbulanceScreen: undefined;
  BloodBankScreen: undefined;
  SlotSelection:undefined;
  ReasonForConsultation:undefined;
  HomeAddress: undefined;
  SelectPatient: undefined;
  ConfirmToPay: undefined;
  HomeServiceBookingConfirmation: {
    orderID: string;
    platformFee: number;
    selectedOption: string | null;
    categoryId?: string;
    providerId?: string;
    date?: string;
    time?: string;
    patient?: any;
    address?: any;
    reason?: string;
    appointmentDetails?: any;
    paymentStatus?: 'success' | 'pending' | 'failed';
    appointmentId?: string;
  };
  HomeServiceCancel: { appointment: UpcomingAppointment };
  HomeServiceCancelConfirmation: {
    appointment: UpcomingAppointment;
    reason?: string;
  };
  HomeServiceReBook: { appointment: CancelledAppointment };
};

export interface AppointmentBase {
  _id: string;
  amount: number;
  appointmentId: string;
  doctorName: string;
  appointmentDepartment: string;
  appointmentType: string;
  appointmentDate: string;
  appointmentTime: string;
  patientName: string;
  status: string;
  clinic?: string;
  fee?: number;
  duration?: number;
  cancellationReason?: string;

}

export interface UpcomingAppointment extends AppointmentBase {
  clinic?: string;
}

export interface CompletedAppointment extends AppointmentBase {
  clinic?: string;
}

export interface CancelledAppointment extends AppointmentBase {
  clinic?: string;
  cancellationReason: string;
}

export type PinManagementParams = {
  action?: 'set' | 'change' | 'forgot';
  phoneNumber?: string;
};