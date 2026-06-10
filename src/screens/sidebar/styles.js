// styles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Import responsive utilities
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  isIOS,
  isAndroid,
  isTablet,
  isSmallDevice,
  isLargeDevice,
  isExtraSmallDevice,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  responsiveWidth,
  responsiveHeight,
  responsiveText,
  moderateScale,
  SAFE_AREA,
  PLATFORM,
} from '../../utils/responsive';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8f0',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SAFE_AREA.safeBottom,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: moderateScale(14),
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: '#f0f8f0',
    paddingTop: SAFE_AREA.safeTop + SPACING.sm,
  },
  backButton: {
    padding: SPACING.xs,
    minWidth: moderateScale(40),
  },
  backIcon: {
    fontSize: moderateScale(20),
    color: '#333',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: SPACING.sm,
  },
  addButton: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  addButtonText: {
    fontSize: moderateScale(14),
    color: '#4caf50',
    fontWeight: '500',
  },
  headerSpacer: {
    flex: 1,
  },
  membersList: {
    flex: 1,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
  },
  membersListContent: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
  },
  membersContainer: {
    paddingBottom: SPACING.md,
  },
  memberCardContainer: {
    marginBottom: SPACING.md,
  },
  memberCard: {
    backgroundColor: '#ffffff',
    borderRadius: LAYOUT.borderRadius.lg,
    ...LAYOUT.shadow.sm,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isTablet ? SPACING.lg : SPACING.md,
  },
  avatar: {
    width: isTablet ? moderateScale(50) : moderateScale(44),
    height: isTablet ? moderateScale(50) : moderateScale(44),
    borderRadius: isTablet ? moderateScale(25) : moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: moderateScale(isTablet ? 16 : 14),
    fontWeight: '600',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: SPACING.xxs,
  },
  memberRelationship: {
    fontSize: moderateScale(12),
    color: '#666',
    marginBottom: SPACING.xs,
  },
  memberPhone: {
    fontSize: moderateScale(12),
    color: '#999',
    fontFamily: 'monospace',
  },
  viewPrescriptionsButton: {
    backgroundColor: '#e3f2fd',
    padding: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    marginTop: SPACING.xs,
    alignItems: 'center',
  },
  viewPrescriptionsText: {
    color: '#2196f3',
    fontWeight: '500',
    fontSize: moderateScale(12),
  },
  patientInfo: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingVertical: SPACING.sm,
  },
  patientName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333',
  },
  appointmentInfo: {
    fontSize: moderateScale(12),
    color: '#666',
    marginTop: SPACING.xxs,
  },
  reportsList: {
    flex: 1,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
  },
  reportsListContent: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
  },
  reportsContainer: {
    paddingBottom: SPACING.md,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SPACING.sm,
    ...LAYOUT.shadow.sm,
  },
  reportContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isTablet ? SPACING.lg : SPACING.md,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: SPACING.xxs,
  },
  reportDate: {
    fontSize: moderateScale(12),
    color: '#666',
    marginBottom: SPACING.xs,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportIcon: {
    fontSize: moderateScale(14),
    marginRight: SPACING.xs,
  },
  reportType: {
    fontSize: moderateScale(12),
    color: '#333',
    fontWeight: '500',
  },
  reportActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: isTablet ? SPACING.lg : SPACING.md,
    bottom: SAFE_AREA.safeBottom + SPACING.lg,
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#4caf50',
    alignItems: 'center',
    justifyContent: 'center',
    ...LAYOUT.shadow.md,
  },
  fabText: {
    fontSize: moderateScale(20),
    color: '#ffffff',
    fontWeight: '300',
  },
  detailsContent: {
    flex: 1,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
  },
  detailsContentContainer: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.xl,
  },
  reportPreview: {
    backgroundColor: '#ffffff',
    borderRadius: LAYOUT.borderRadius.md,
    padding: isTablet ? SPACING.lg : SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...LAYOUT.shadow.sm,
  },
  pdfIcon: {
    backgroundColor: '#f44336',
    borderRadius: LAYOUT.borderRadius.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  pdfText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  reportPreviewTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: SPACING.xxs,
  },
  reportPreviewSubtitle: {
    fontSize: moderateScale(12),
    color: '#666',
    marginBottom: SPACING.sm,
  },
  fileInfo: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  fileInfoItem: {
    alignItems: 'center',
  },
  fileInfoLabel: {
    fontSize: moderateScale(10),
    color: '#666',
    marginBottom: SPACING.xxs,
  },
  fileInfoValue: {
    fontSize: moderateScale(12),
    color: '#333',
    fontWeight: '500',
  },
  reportInformation: {
    backgroundColor: '#ffffff',
    borderRadius: LAYOUT.borderRadius.md,
    padding: isTablet ? SPACING.lg : SPACING.md,
    marginBottom: SAFE_AREA.safeBottom + SPACING.xl,
    ...LAYOUT.shadow.sm,
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: moderateScale(12),
    color: '#666',
  },
  infoValue: {
    fontSize: moderateScale(12),
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.md,
  },
  homeVisit: {
    color: '#2196f3',
  },
  bottomActions: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: SAFE_AREA.safeBottom + SPACING.md,
    left: isTablet ? SPACING.lg : SPACING.md,
    right: isTablet ? SPACING.lg : SPACING.md,
    gap: SPACING.sm,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196f3',
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    gap: SPACING.xs,
  },
  downloadIcon: {
    fontSize: moderateScale(14),
    color: '#ffffff',
  },
  downloadText: {
    fontSize: moderateScale(12),
    color: '#ffffff',
    fontWeight: '500',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    gap: SPACING.xs,
  },
  shareIcon: {
    fontSize: moderateScale(14),
    color: '#333',
  },
  shareText: {
    fontSize: moderateScale(12),
    color: '#333',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: moderateScale(14),
    color: '#f44336',
  },
  reportViewContent: {
    flex: 1,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
  },
  reportViewContentContainer: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.xl,
  },
  reportDocument: {
    backgroundColor: '#ffffff',
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SAFE_AREA.safeBottom + SPACING.xl,
    ...LAYOUT.shadow.sm,
    padding: isTablet ? SPACING.lg : SPACING.md,
  },
  documentHeader: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: SPACING.sm,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: SPACING.xxs,
  },
  doctorTitle: {
    fontSize: moderateScale(12),
    color: '#666',
    marginBottom: SPACING.xxs,
  },
  clinicInfo: {
    fontSize: moderateScale(10),
    color: '#666',
  },
  patientDetails: {
    alignItems: isTablet ? 'flex-end' : 'flex-start',
  },
  patientDetailText: {
    fontSize: moderateScale(10),
    color: '#666',
    marginBottom: SPACING.xxs,
  },
  patientDetailValue: {
    fontSize: moderateScale(10),
    color: '#333',
    marginBottom: SPACING.xxs,
  },
  reportBody: {
    padding: isTablet ? SPACING.lg : SPACING.md,
  },
  reportSection: {
    fontSize: moderateScale(12),
    color: '#333',
    marginBottom: SPACING.md,
  },
  vitalsSection: {
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: SPACING.sm,
  },
  sectionHeader: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#2196f3',
    marginBottom: SPACING.sm,
  },
  vitalsContainer: {
    flexDirection: 'column',
    gap: SPACING.xxs,
  },
  vitalsText: {
    fontSize: moderateScale(10),
    color: '#333',
    lineHeight: moderateScale(14),
    flexWrap: 'wrap',
  },
  diagnosisSection: {
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: SPACING.sm,
  },
  diagnosisRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  diagnosisTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.sm,
    fontSize: moderateScale(10),
    color: '#333',
    fontWeight: '500',
  },
  yellowHighlight: {
    backgroundColor: '#fff3cd',
    height: moderateScale(16),
    borderRadius: LAYOUT.borderRadius.sm,
    marginTop: SPACING.xxs,
  },
  adviceSection: {
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: SPACING.sm,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxs,
  },
  bullet: {
    fontSize: moderateScale(10),
    color: '#333',
    marginRight: SPACING.xs,
  },
  adviceText: {
    fontSize: moderateScale(10),
    color: '#333',
    flexWrap: 'wrap',
  },
  signature: {
    alignItems: 'flex-end',
  },
  signatureText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#333',
    marginBottom: SPACING.xxs,
  },
  signatureTitle: {
    fontSize: moderateScale(10),
    color: '#666',
  },
  signatureSection: {
    alignItems: 'flex-end',
    marginTop: SPACING.md,
  },
  signatureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xxs,
  },
  signatureIcon: {
    fontSize: moderateScale(12),
    color: '#333',
    marginRight: SPACING.xxs,
  },
  signatureNote: {
    fontSize: moderateScale(10),
    color: '#333',
  },
  appointmentsList: {
    flex: 1,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
  },
  appointmentsListContent: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
  },
  appointmentsContainer: {
    paddingBottom: SPACING.md,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SPACING.md,
    ...LAYOUT.shadow.sm,
  },
  appointmentContent: {
    padding: isTablet ? SPACING.lg : SPACING.md,
  },
  appointmentDate: {
    fontSize: moderateScale(12),
    color: '#666',
    marginBottom: SPACING.xs,
  },
  appointmentDoctor: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: SPACING.xxs,
  },
  appointmentDepartment: {
    fontSize: moderateScale(12),
    color: '#333',
    marginBottom: SPACING.xxs,
  },
  appointmentStatus: {
    fontSize: moderateScale(12),
    color: '#4caf50',
    fontWeight: '500',
  },
  noAppointments: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  noAppointmentsText: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  prescriptionsList: {
    flex: 1,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
  },
  prescriptionsListContent: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
  },
  prescriptionsContainer: {
    paddingBottom: SPACING.md,
  },
  prescriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SPACING.md,
    ...LAYOUT.shadow.sm,
    padding: isTablet ? SPACING.lg : SPACING.md,
  },
  prescriptionContent: {
    padding: isTablet ? SPACING.lg : SPACING.md,
  },
  headerSection: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  headerImage: {
    width: '100%',
    maxHeight: moderateScale(120),
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  clinicInfo: {
    marginBottom: SPACING.md,
  },
  clinicName: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: SPACING.xxs,
    flexWrap: 'wrap',
  },
  clinicContact: {
    fontSize: moderateScale(10),
    color: '#6c757d',
    marginBottom: SPACING.xxs,
    flexWrap: 'wrap',
  },
  patientDetailsSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxs,
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: moderateScale(10),
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: moderateScale(10),
    color: '#333',
    flex: 2,
    textAlign: 'left',
    flexWrap: 'wrap',
  },
  notesDisplay: {
    marginTop: SPACING.sm,
  },
  notesLabel: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#666',
    marginBottom: SPACING.xxs,
  },
  notesContent: {
    fontSize: moderateScale(10),
    color: '#333',
    flexWrap: 'wrap',
  },
  followUpDate: {
    fontSize: moderateScale(10),
    color: '#333',
  },
  prescriptionFooter: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: moderateScale(10),
    color: '#6c757d',
    textAlign: 'center',
  },
  digitalSignature: {
    width: moderateScale(100),
    height: moderateScale(48),
    marginBottom: SPACING.xxs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#f0f8f0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    marginHorizontal: SPACING.xxs,
  },
  activeFilter: {
    backgroundColor: '#2196f3',
  },
  filterText: {
    fontSize: moderateScale(12),
    color: '#333',
    fontWeight: '500',
  },
  noPrescriptions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  noPrescriptionsText: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadPrescriptionButton: {
    backgroundColor: '#2196f3',
    padding: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  downloadedButton: {
    backgroundColor: '#4caf50',
  },
  downloadPrescriptionText: {
    color: '#ffffff',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  noReports: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  noReportsText: {
    fontSize: moderateScale(14),
    color: '#666',
    textAlign:'center'
  },
});