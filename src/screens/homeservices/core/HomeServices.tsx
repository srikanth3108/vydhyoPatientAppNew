import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ImageBackground,
  FlatList,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { getHomeCareRoles } from '../../../services/homeCareService';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';
import {
  verticalScale,
  moderateScale,
  SAFE_AREA,
  SPACING,
  LAYOUT,
  isTablet,
} from '../../../utils/responsive';

export type ProviderFilters = {
  gender: 'Any' | 'Male' | 'Female';
  minRating: number;
  minExperience: number;
  verifiedOnly: boolean;
};

type RootStackParamList = {
  HomeServices: undefined;
  HomeServiceProviders: { role: string; filters?: ProviderFilters };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const translations: Record<string, Record<string, string>> = {
  en: {
    homeServices: 'Home Services',
    subtitle: 'Certified care professionals at your doorstep',
    providers: 'providers',
    explore: 'Explore',
  },
  hi: {
    homeServices: 'होम सेवाएँ',
    subtitle: 'प्रमाणित देखभाल विशेषज्ञ आपके दरवाजे पर',
    providers: 'प्रदाता',
    explore: 'देखें',
  },
  tel: {
    homeServices: 'హోమ్ సర్వీసులు',
    subtitle: 'మీ ఇంటి వద్ద సర్టిఫైడ్ కేర్ ప్రొఫెషనల్స్',
    providers: 'ప్రొవైడర్లు',
    explore: 'చూడండి',
  },
};

const HomeServices: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useSelector((state: any) => state.currentUser);
  const lang = user?.appLanguage || 'en';
  const t = translations[lang] || translations.en;

  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<ProviderFilters>({
    gender: 'Any',
    minRating: 0,
    minExperience: 0,
    verifiedOnly: false,
  });

  const filteredRoles = roles.filter(role => 
    role.toLowerCase().includes(searchQuery.toLowerCase()) || 
    getRoleTagline(role).toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getHomeCareRoles();
        console.log('Fetched roles:', result);
        if (result.error) {
          setError(result.error);
          setRoles([]);
        } else {
          setRoles(result.roles);
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
        setError('Failed to load services');
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user?.token]);

  const renderitems = ({ item: role }: { item: string }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.gridItem}
      onPress={() =>
        navigation.navigate('HomeServiceProviders', {
          role: role,
          filters: filters,
        })
      }
    >
      <View style={[hsStyles.card, styles.categoryCard, { marginBottom: 0 }]}>
        <View
          style={[
            styles.plainCard,
            { backgroundColor: getGradientColor(role) },
          ]}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.emojiBadge}>
              <Text style={styles.emoji}>{getRoleEmoji(role)}</Text>
            </View>

            <View
              style={[
                hsStyles.badge,
                {
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  paddingHorizontal: SPACING.xs,
                },
              ]}
            >
              <Text
                style={[
                  hsStyles.badgeText,
                  { color: '#FFF' },
                ]}
              >
                View {t.providers}
              </Text>
            </View>
          </View>

          <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: SPACING.xs }}>
            <Text style={styles.catTitle} numberOfLines={1}>
              {capitalizeFirstLetter(role)}
            </Text>
            <Text style={styles.catTaglineLight} numberOfLines={2}>
              {getRoleTagline(role)}
            </Text>
          </View>

          <Text style={styles.exploreText}>
            {t.explore} →
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[hsStyles.screen, styles.centerContainer]}>
        <ActivityIndicator size="large" color={HS_COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={hsStyles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.gradientStart} />

      <View style={styles.heroGradient}>
        <Text style={hsStyles.heroTitle}>{t.homeServices}</Text>
        <Text style={hsStyles.heroSubtitle}>{t.subtitle}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>31+</Text>
            <Text style={styles.statLabel}>Verified providers</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>4.8★</Text>
            <Text style={styles.statLabel}>Avg. rating</Text>
          </View>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {roles.length === 0 && !error && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No services available</Text>
        </View>
      )}

      {roles.length > 0 && (
        <FlatList
          data={filteredRoles}
          keyExtractor={item => item}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            hsStyles.scrollContent,
            styles.list,
            { paddingBottom: SAFE_AREA.safeBottom + 20 },
          ]}
          ListHeaderComponent={
            <>
              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search services..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <TouchableOpacity onPress={() => setShowFilterModal(true)}>
                  <Text style={styles.filterIcon}>⚙️</Text>
                </TouchableOpacity>
              </View>
              <Text style={hsStyles.sectionTitle}>Choose a service</Text>
              {filteredRoles.length === 0 && (
                <Text style={styles.emptySearchText}>No services match your search.</Text>
              )}
            </>
          }
          renderItem={renderitems}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Providers</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Gender</Text>
            <View style={styles.filterRow}>
              {['Any', 'Male', 'Female'].map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.filterChip, filters.gender === g && styles.filterChipActive]}
                  onPress={() => setFilters({ ...filters, gender: g as any })}
                >
                  <Text style={[styles.filterChipText, filters.gender === g && styles.filterChipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
            <View style={styles.filterRow}>
              {[0, 3.5, 4.0, 4.5].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.filterChip, filters.minRating === r && styles.filterChipActive]}
                  onPress={() => setFilters({ ...filters, minRating: r })}
                >
                  <Text style={[styles.filterChipText, filters.minRating === r && styles.filterChipTextActive]}>
                    {r === 0 ? 'Any' : `${r}★ & up`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>Minimum Experience</Text>
            <View style={styles.filterRow}>
              {[0, 3, 5, 10].map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.filterChip, filters.minExperience === e && styles.filterChipActive]}
                  onPress={() => setFilters({ ...filters, minExperience: e })}
                >
                  <Text style={[styles.filterChipText, filters.minExperience === e && styles.filterChipTextActive]}>
                    {e === 0 ? 'Any' : `${e}+ Years`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSectionDivider} />

            <TouchableOpacity 
              style={styles.verifyToggle}
              activeOpacity={0.7}
              onPress={() => setFilters({ ...filters, verifiedOnly: !filters.verifiedOnly })}
            >
              <Text style={styles.filterSectionTitle}>Verified Providers Only</Text>
              <View style={[styles.checkbox, filters.verifiedOnly && styles.checkboxActive]}>
                {filters.verifiedOnly && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.resetBtn}
                onPress={() => setFilters({ gender: 'Any', minRating: 0, minExperience: 0, verifiedOnly: false })}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyBtn}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
};

// Helper function to get emoji for role
const getRoleEmoji = (role: string): string => {
  const emojiMap: Record<string, string> = {
    nursing: '💉',
    medication: '💊',
    physcologist: '🧠',
    physiotherapy: '🩺',
    'elder care': '🤝',
    'lab at home': '🧪',
  };
  return emojiMap[role.toLowerCase()] || '🏥';
};

// Helper function to get tagline for role
const getRoleTagline = (role: string): string => {
  const taglineMap: Record<string, string> = {
    nursing: 'Skilled nurses for daily care & recovery',
    medication: 'Professional medication management',
    physcologist: 'Mental health & counseling services',
    physiotherapy: 'Recovery & mobility at your doorstep',
    'elder care': 'Compassionate support for seniors',
    'lab at home': 'Sample collection without clinic visits',
  };
  return taglineMap[role.toLowerCase()] || 'Professional healthcare services';
};

// Helper function to get gradient color for role
const getGradientColor = (role: string): string => {
  const colorMap: Record<string, string> = {
    nursing: '#0D5C4B',
    medication: '#5B3E8C',
    physcologist: '#8B3A2A',
    physiotherapy: '#0F4C81',
    'elder care': '#5B3E8C',
    'lab at home': '#8B3A2A',
  };
  return colorMap[role.toLowerCase()] || '#0F4C81';
};

// Helper function to capitalize first letter
const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const styles = StyleSheet.create({
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
  },
  errorText: {
    color: '#DC2626',
    fontSize: moderateScale(14),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: HS_COLORS.textMuted,
  },
  heroGradient: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(20),
    borderBottomLeftRadius: LAYOUT.borderRadius.xl,
    borderBottomRightRadius: LAYOUT.borderRadius.xl,
    backgroundColor: HS_COLORS.gradientStart,
  },
  cardImageOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: moderateScale(11),
    marginTop: 2,
  },
  list: {
    paddingTop: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginBottom: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: moderateScale(14),
    color: '#1E293B',
  },
  searchIcon: {
    fontSize: moderateScale(16),
    marginRight: SPACING.sm,
    color: '#94A3B8',
  },
  filterIcon: {
    fontSize: moderateScale(16),
    marginLeft: SPACING.sm,
    color: '#94A3B8',
  },
  emptySearchText: {
    fontSize: moderateScale(14),
    color: '#64748B',
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  gridItem: {
    flex: 0.485,
  },
  categoryCard: {
    padding: 0,
    overflow: 'hidden',
  },
  cardImage: {
    height: verticalScale(160),
    justifyContent: 'flex-end',
  },
  cardImageRadius: {
    borderRadius: LAYOUT.borderRadius.lg,
  },
  plainCard: {
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    height: verticalScale(160),
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xxl,
  },
  emojiBadge: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(9),
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: moderateScale(18),
  },
  catTitle: {
    color: '#FFFFFF',
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
  catTagline: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: moderateScale(11),
    marginTop: SPACING.xxs,
  },
  catTaglineLight: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: moderateScale(11),
    marginTop: SPACING.xxs,
    marginBottom: SPACING.xxs,
  },
  exploreRow: {
    marginTop: SPACING.xs,
  },
  exploreText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: LAYOUT.borderRadius.xl,
    borderTopRightRadius: LAYOUT.borderRadius.xl,
    padding: SPACING.lg,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  closeIcon: {
    fontSize: moderateScale(20),
    color: '#64748B',
    padding: SPACING.xs,
  },
  filterSectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1E293B',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: HS_COLORS.primary,
  },
  filterChipText: {
    fontSize: moderateScale(13),
    color: '#475569',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: HS_COLORS.primary,
    fontWeight: '700',
  },
  filterSectionDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: SPACING.sm,
  },
  verifyToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: HS_COLORS.primary,
    borderColor: HS_COLORS.primary,
  },
  checkmark: {
    color: '#FFF',
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  resetBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#64748B',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  applyBtn: {
    flex: 2,
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: HS_COLORS.primary,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
});

export default HomeServices;
