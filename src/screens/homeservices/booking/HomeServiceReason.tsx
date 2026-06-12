import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getProviderDetailsById } from '../../../services/homeCareService';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';
import { SPACING, moderateScale, LAYOUT } from '../../../utils/responsive';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';

type Params = {
  providerId: string;
  provider: any;
  date: string;
  time: string;
};

type NavList = {
  HomeServiceReason: Params;
  HomeServiceSelectPatient: Params & { reason: string };
};

type Route = RouteProp<NavList, 'HomeServiceReason'>;
type Nav = StackNavigationProp<NavList, 'HomeServiceReason'>;

const MAX_LEN = 500;
const QUICK_REASONS = [
  'Post-surgery recovery',
  'Chronic back pain',
  'Mobility difficulty',
  'Routine check-up',
  'Medication support',
];

const HomeServiceReason: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [reason, setReason] = useState('');
  const [provider, setProvider] = useState<any>(route.params.provider);
  const [loading, setLoading] = useState(true);

  const [attachments, setAttachments] = useState<any[]>([]);
  const openDocumentPicker = async () => {
    try {
      const docs = await DocumentPicker.pick({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
        allowMultiSelection: true,
        mode: 'open',
      });

      const newFiles = await Promise.all(
        docs.map(async (doc) => {
          const base64 = await RNFS.readFile(doc.uri, 'base64');
          return {
            name: doc.name,
            size: doc.size,
            uri: doc.uri,
            type: doc.type,
            data: base64,
          };
        }),
      );

      setAttachments((prev) => [...prev, ...newFiles]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled the picker');
      } else {
        console.log('DocumentPicker Error:', err);
      }
    }
  };
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };
  const handleNext = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    navigation.navigate('HomeServiceSelectPatient', {
      ...route.params,
      provider,
      reason: trimmed,
      attachments,
    } as any);
  };

  return (
    <SafeAreaView style={hsStyles.screen}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
            <ScrollView contentContainerStyle={styles.scroll}>
              {provider?.fullName && (
                <View style={[styles.summaryCard, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
                    <View style={[hsStyles.avatar, { width: 50, height: 50 }]}>
                      <Text style={[hsStyles.avatarText, { fontSize: 20 }]}>{provider.fullName.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                      <Text style={styles.summaryName}>{provider.fullName}</Text>
                      {provider.specialization ? <Text style={hsStyles.muted}>{provider.specialization}</Text> : null}
                      {provider.profession ? <Text style={[hsStyles.muted, { marginTop: 4, fontSize: 12 }]}>Clinic Name: {provider.profession}</Text> : null}
                    </View>
                  </View>
                  {provider.homeAddress && (
                    <View style={{ marginTop: SPACING.sm, paddingLeft: 60, flexDirection: 'row' }}>
                      <Text style={{ color: '#E74C3C', marginRight: 4 }}>📍</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: '#3b82f6' }}>{provider.homeAddress}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={{ width: '100%', alignItems: 'flex-end', marginTop: 8 }} onPress={() => navigation.navigate('ProviderDetails' as any, { providerId: route.params.providerId })}>
                    <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '600' }}>👁 View Details</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={hsStyles.sectionTitle}>Quick picks</Text>
              <View style={styles.chipsRow}>
                {QUICK_REASONS.map(chip => (
                  <TouchableOpacity
                    key={chip}
                    style={[styles.chip, reason === chip && styles.chipActive]}
                    onPress={() => setReason(chip)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        reason === chip && styles.chipTextActive,
                      ]}
                    >
                      {chip}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={hsStyles.sectionTitle}>Describe in your words</Text>
              <TextInput
                style={styles.input}
                multiline
                maxLength={MAX_LEN}
                placeholder="e.g. knee pain after fall, need physio for 2 weeks..."
                placeholderTextColor={HS_COLORS.textMuted}
                value={reason}
                onChangeText={setReason}
                textAlignVertical="top"
              />
              <Text style={styles.counter}>
                {reason.length}/{MAX_LEN}
              </Text>
              <View style={styles.uploadContainer}>
                <Text style={hsStyles.sectionTitle}>
                  Medical Reports (Optional)
                </Text>
                
                <TouchableOpacity
                  style={styles.uploadArea}
                  onPress={openDocumentPicker}
                  activeOpacity={0.7}
                >
                  <View style={styles.uploadIconContainer}>
                    <Text style={styles.uploadIcon}>📄</Text>
                  </View>
                  <Text style={styles.uploadTitle}>
                    Upload Images or PDF
                  </Text>
                  <Text style={styles.uploadSubtitle}>
                    Up to 5MB per file
                  </Text>
                </TouchableOpacity>

                {attachments.length > 0 && (
                  <View style={styles.fileList}>
                    {attachments.map((file, index) => (
                      <View key={index} style={styles.fileCard}>
                        <View style={styles.fileIconBox}>
                          <Text style={styles.fileIcon}>
                            {file.type?.includes('pdf') ? '📕' : '🖼️'}
                          </Text>
                        </View>
                        <View style={styles.fileInfo}>
                          <Text numberOfLines={1} style={styles.fileName}>
                            {file.name}
                          </Text>
                          <Text style={styles.fileSize}>
                            {file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => removeAttachment(index)}
                        >
                          <Text style={styles.removeIcon}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[hsStyles.primaryBtn, !reason.trim() && styles.disabled]}
                disabled={!reason.trim()}
                onPress={handleNext}
              >
                <Text style={hsStyles.primaryBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    fontSize: moderateScale(14),
    color: HS_COLORS.text,
    marginTop: SPACING.md,
  },
  scroll: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  summaryCard: {
    backgroundColor: HS_COLORS.card,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
  },
  summaryName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: HS_COLORS.text,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: {
    backgroundColor: HS_COLORS.card,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
  },
  chipActive: {
    backgroundColor: HS_COLORS.primary,
    borderColor: HS_COLORS.primary,
  },
  chipText: { fontSize: moderateScale(12), color: HS_COLORS.text },
  chipTextActive: { color: '#FFF', fontWeight: '600' },
  input: {
    backgroundColor: HS_COLORS.card,
    borderRadius: LAYOUT.borderRadius.lg,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    padding: SPACING.md,
    minHeight: moderateScale(120),
    fontSize: moderateScale(14),
    color: HS_COLORS.text,
  },
  counter: {
    textAlign: 'right',
    fontSize: moderateScale(11),
    color: HS_COLORS.textMuted,
    marginTop: SPACING.xxs,
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: HS_COLORS.border,
    backgroundColor: HS_COLORS.bg,
  },
  disabled: { opacity: 0.5, backgroundColor: '#94A3B8' },
  uploadContainer: {
    marginTop: 20,
    marginBottom: 30,
  },

  uploadArea: {
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  uploadIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  uploadIcon: { fontSize: 24 },
  uploadTitle: {
    color: '#1E3A8A',
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginBottom: 4,
  },
  uploadSubtitle: {
    color: '#60A5FA',
    fontSize: moderateScale(11),
  },
  fileList: { marginTop: SPACING.md, gap: SPACING.sm },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  fileIcon: { fontSize: 18 },
  fileInfo: { flex: 1, marginRight: SPACING.sm },
  fileName: {
    color: HS_COLORS.text,
    fontSize: moderateScale(13),
    fontWeight: '600',
    marginBottom: 2,
  },
  fileSize: {
    color: HS_COLORS.textMuted,
    fontSize: moderateScale(11),
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    color: '#EF4444',
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
});

export default HomeServiceReason;
