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

type RootStackParamList = {
  HomeServices: undefined;
  HomeServiceProviders: { role: string };
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

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getHomeCareRoles();
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
          data={roles}
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
              <Text style={hsStyles.sectionTitle}>Choose a service</Text>
            </>
          }
          renderItem={renderitems}
        />
      )}
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
});

export default HomeServices;
