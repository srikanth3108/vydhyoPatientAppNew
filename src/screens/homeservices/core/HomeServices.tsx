import React, { useState, useEffect, useLayoutEffect } from 'react';
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

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
      activeOpacity={0.85}
      style={styles.gridItem}
      onPress={() =>
        navigation.navigate('HomeServiceProviders', {
          role: role,
          filters: filters,
        })
      }
    >
      <View style={styles.premiumCard}>
        <View style={styles.cardTopRow}>
          <View style={[styles.premiumEmojiBadge, { backgroundColor: getGradientColor(role) + '20' }]}>
            <Text style={styles.emoji}>{getRoleEmoji(role)}</Text>
          </View>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>View {t.providers}</Text>
          </View>
        </View>

        <View style={{ flex: 1, marginTop: SPACING.sm, justifyContent: 'center' }}>
          <Text style={styles.premiumCatTitle} numberOfLines={1}>
            {capitalizeFirstLetter(role)}
          </Text>
          <Text style={styles.premiumCatTagline} numberOfLines={2}>
            {getRoleTagline(role)}
          </Text>
        </View>

        <View style={styles.exploreRow}>
          <Text style={[styles.premiumExploreText, { color: getGradientColor(role) }]}>
            {t.explore}
          </Text>
          <Text style={[styles.premiumExploreIcon, { color: getGradientColor(role) }]}>→</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#0B2447" />

      <View style={styles.heroGradient}>
        {/* Premium Faux Gradient Details */}
        <View style={styles.heroDeco1} />
        <View style={styles.heroDeco2} />
        <View style={styles.headerTopRow}>  
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backButtonIcon}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={{ position: 'relative', zIndex: 10 }}>
          <Text style={styles.premiumHeroTitle}>{t.homeServices}</Text>
          <Text style={styles.premiumHeroSubtitle}>{t.subtitle}</Text>
          {/* <View style={styles.statsRow}> */}
          {/* <View style={styles.statPill}>
              <Text style={styles.statValue}>31+</Text>
              <Text style={styles.statLabel}>Verified providers</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>4.8★</Text>
              <Text style={styles.statLabel}>Avg. rating</Text>
            </View> */}
          {/* </View> */}
          <View style={styles.floatingSearchContainer}>
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
              <Text style={styles.premiumSectionTitle}>Choose a service</Text>
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
    paddingTop: verticalScale(40), // Adjusted for status bar if needed, or safe area
    paddingBottom: verticalScale(28), // Reduced padding
    borderBottomLeftRadius: LAYOUT.borderRadius.xl,
    borderBottomRightRadius: LAYOUT.borderRadius.xl,
    backgroundColor: '#0B2447', // Deep Premium Navy
    position: 'relative',
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    zIndex: 20,
  },
  backButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backButtonIcon: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  heroDeco1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: moderateScale(180),
    height: moderateScale(180),
    borderRadius: moderateScale(90),
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroDeco2: {
    position: 'absolute',
    bottom: -60,
    left: -20,
    width: moderateScale(220),
    height: moderateScale(220),
    borderRadius: moderateScale(110),
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // Soft emerald tint
  },
  premiumHeroTitle: {
    fontSize: moderateScale(26),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: SPACING.xxs,
  },
  premiumHeroSubtitle: {
    fontSize: moderateScale(14),
    color: 'rgba(255,255,255,0.85)',
    lineHeight: moderateScale(20),
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: moderateScale(11),
    fontWeight: '600',
    marginTop: 2,
  },
  list: {
    paddingTop: 0,
  },
  floatingSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: moderateScale(15), // Pull up into hero
    // marginBottom: SPACING.md, // Reduced margin
    borderRadius: moderateScale(24),
    paddingHorizontal: SPACING.lg,
    paddingVertical: 4,
    // ...LAYOUT.shadow.lg,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: moderateScale(14),
    color: '#1E293B',
    fontWeight: '500',
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
  premiumSectionTitle: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: moderateScale(15),
    marginBottom: SPACING.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  gridItem: {
    flex: 0.485,
  },
  premiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    height: verticalScale(170),
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  premiumEmojiBadge: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: moderateScale(20),
  },
  premiumBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: LAYOUT.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  premiumBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: '#64748B',
  },
  premiumCatTitle: {
    color: '#0F172A',
    fontSize: moderateScale(15),
    fontWeight: '800',
    marginBottom: 4,
  },
  premiumCatTagline: {
    color: '#64748B',
    fontSize: moderateScale(11),
    lineHeight: moderateScale(15),
    fontWeight: '500',
  },
  exploreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  premiumExploreText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  premiumExploreIcon: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginLeft: 4,
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
