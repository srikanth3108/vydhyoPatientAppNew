// Live server IP address
export const BASE_URL = 'https://server.vydhyo.com';

// Testing / other IP addresses (commented out for reference)
// const BASE_URL = 'http://vitals-backend-app-env.eba-2zkpksar.ap-south-1.elasticbeanstalk.com/api/v1';
// const BASE_URL = 'http://192.168.0.21:3000';
// const BASE_URL = 'http://172.16.16.83:3000';
// const BASE_URL = "http://216.10.251.239:3000";

export const ENDPOINTS = {
  // Authentication
  LOGIN: 'auth/login',
  LOGIN_WITH_PIN: 'auth/loginWithPin',
  REGISTER_PATIENT: 'auth/registerPatient',
  VALIDATE_OTP: 'auth/validateOtp',
  RESEND_OTP: 'auth/resendOtp',
  LOGOUT: 'auth/logout',
  SET_PIN: 'auth/setPin',
  CHANGE_PIN: 'auth/changePin',
  FORGOT_PIN: 'auth/forgotPin',

  // User Endpoints
  GET_USER: (userId?: string) => userId ? `users/getUser?userId=${userId}` : 'users/getUser',
  GET_CLINIC_ADDRESS: (doctorId: string) => `users/getClinicAddress?doctorId=${doctorId}`,
  ADD_ADDRESS: 'users/addAddress',
  GET_ADDRESSES: 'users/getAddress',
  ADD_FEEDBACK: 'users/addFeedback',
  SUBMIT_PATIENT_RESPONSE: 'users/submitPatientResponse',
  UPDATE_FCM_TOKEN: 'users/updateFcmToken',
  GET_KYC_BY_USER_ID: 'users/getKycByUserId',
  UPDATE_LANGUAGE: (userId: string, code: string) => `users/${userId}/${code}/language`,
  VYDUSER396_LANGUAGE: (selectedLanguage: string) => `users/VYDUSER396/${selectedLanguage}/language`,
  GET_ALL_FEEDBACKS: (userId: string) => `users/getAllFeedbacksGivenByPatient/${userId}`,
  GET_DOCTORS_LIST_BY_FAMILY: (userId: string) => `users/getDoctorsListByFamily/${userId}`,
  GET_FEEDBACK_BY_ID: (feedbackId: string) => `users/getFeedbackById/${feedbackId}`,
  ADD_KYC_DETAILS: 'users/addKYCDetails',
  GENERATE_REFERRAL_CODE: 'users/generateReferralCode',

  // Appointment Endpoints
  CANCEL_APPOINTMENT: 'appointment/cancelAppointment',
  CREATE_APPOINTMENT: 'appointment/createAppointment',
  RELEASE_DOCTOR_SLOT: 'appointment/releaseDoctorSlot',
  RESCHEDULE_APPOINTMENT: 'appointment/rescheduleAppointment',
  UPDATE_APPOINTMENT_STATUS: 'appointment/updateAppointmentStatus',
  DELETE_FAMILY_MEMBER: (memberUserId: string) => `appointment/deleteFamilyMember/${memberUserId}`,
  GET_ALL_FAMILY_APPOINTMENTS: (userId: string, status?: string) => status ? `appointment/getAllFamilyAppointments/${userId}?status=${status}` : `appointment/getAllFamilyAppointments/${userId}`,
  GET_APPOINTMENT: (appointmentId: string) => `appointment/getAppointment?appointmentId=${encodeURIComponent(appointmentId)}`,
  GET_SLOTS: (doctorId: string, date: string, addressId: string) => `appointment/getSlotsByDoctorIdAndDate?doctorId=${doctorId}&date=${date}&addressId=${addressId}`,

  // Doctor Endpoints
  CREATE_PATIENT_FROM_PATIENT_APP: 'doctor/createPatientFromPatientApp',
  GET_ALL_FAMILY_MEMBERS: (userId: string) => `doctor/getAllFamilyMembers?userId=${userId}`,
  UPDATE_PATIENT: (userId: string) => `doctor/updatePatientFromPatientApp?userId=${userId}`,

  // Document Endpoints
  UPLOAD_DOCUMENTS: 'documents/upload-documents',
  DELETE_DOCUMENT: (id: string) => `documents/deleteDocument/${id}`,
  GET_DOCUMENTS: (patientId: string, page: number, limit: number) => `documents/getdocumentsByPatientId/${patientId}?page=${page}&limit=${limit}`,

  // Finance Endpoints
  CREATE_PAYMENT_ORDER: 'finance/createPaymentOrder',
  GET_FINANCE: (userId: string) => `finance/${userId}`,
  GET_AVAILABLE_BALANCE: (userId: string) => `finance/available/${userId}`,
  CREATE_PAYMENT: 'finance/createPayment',
  GET_APPOINTMENT_PAYMENT: (appointmentId: string) => `finance/getAppointmentPayment?appointmentId=${appointmentId}`,
  GET_PAYMENTS_BY_ORDER_ID: (orderId: string) => `finance/getPaymentsByOrderId/${orderId}`,
  GET_STATUS_BY_LINK_ID: (linkId: string) => `finance/getstatusbyLinkid/${linkId}`,
  PLACE_ORDER: (appointmentId: string) => `finance/placeOrder?appointmentId=${appointmentId}`,
  VALIDATE_COUPON_CODE: 'finance/validateCouponCode',

  // Whatsapp / Other Endpoints
  GET_SPECIALIZATIONS: 'whatsapp/getDoctorSpecializationsWithImages',
  GET_DOCTORS_BY_SPECIALIZATION: 'whatsapp/getDoctorsBySpecialization',
  GET_APPOINTMENT_RECEIPT: (appointmentId: string) => `whatsappbooking/getAppointmentReceipt/${appointmentId}`,



  // Home care Endpoints
  GET_HOME_CARE_ROLES: 'provider/roles',
  GET_HOME_CARE_PROVIDERS_ROLE: 'provider/role/',
  GET_HOME_CARE_PROVIDER_ID: (providerId: string) => `provider/getProvider/${providerId}`,
  CREATE_APPROVIDER_APPOINTMENT: 'appointment/createProviderAppointment',
  GET_PROVIDER_AVAILABILITY_SLOTS: (providerId: string) => `provider-slots/getProviderAvailability?providerId=${providerId}`,
  GET_FAMILY_MEMBERS: 'family-member/getFamilyMembers',
  ADD_FAMILY_MEMBER: 'family-member/addFamilyMember',
  UPDATE_FAMILY_MEMBER: 'family-member/updateFamilyMember',
  CREATE_PROVIDER_APPOINTMENT:'appointment/createProviderAppointmentWithGateway',
  PAYMENT_VERIFY:'appointment/verifyProviderAppointmentPayment'
  // DELETE_FAMILY_MEMBER: (familyMemberId: string) => `family-member/deleteFamilyMember/${familyMemberId}`,
};
