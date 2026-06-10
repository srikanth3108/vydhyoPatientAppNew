import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { getProvidersByRole, HomeCareProvider } from '../../../services/homeCareService';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';
import { SPACING, moderateScale, LAYOUT } from '../../../utils/responsive';

type Params = { role: string };
type NavList = {
  HomeServiceProviders: Params;
  ProviderDetails: { providerId: string; role: string };
  HomeServiceOfferings: { providerId: string; role: string };
};

type Route = RouteProp<NavList, 'HomeServiceProviders'>;
type Nav = StackNavigationProp<NavList, 'HomeServiceProviders'>;

// Transform API provider to display format
const transformProvider = (apiProvider: HomeCareProvider) => ({
  id: apiProvider.userId,
  name: apiProvider.fullName,
  businessName: apiProvider.profession,
  rating: apiProvider.overallRating || 0,
  reviewCount: apiProvider.totalReviews || 0,
  experienceYears: apiProvider.totalExperience || 0,
  location: apiProvider.homeAddress.split(',')[0] || 'Location',
  consultationFee: apiProvider.consultationFee || 0,
  distance: '~0 km',
  verified: apiProvider.verificationStatus === 'reviewing' || apiProvider.verificationStatus === 'verified',
  avatarInitial: apiProvider.fullName.charAt(0).toUpperCase(),
  specialties: apiProvider.selectedServices || [],
  startingPrice: 0,
  profilePhoto: apiProvider.profilePhoto,
  email: apiProvider.email,
  mobile: apiProvider.mobile,
  gender: apiProvider.gender,
  qualification: apiProvider.highestQualification,
  specialization: apiProvider.specialization,
});

// console.log('transformProvider.....',apiProvider);


const ProviderCard: React.FC<{
  provider: ReturnType<typeof transformProvider>;
  onPress: () => void;
}> = ({ provider, onPress }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      if (i + 1 <= Math.floor(rating)) return '★';
      if (i + 0.5 < rating) return '⯨';
      return '☆';
    }).join('');
  };

  console.log('Rendering ProviderCard for:', provider);

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
      <View style={[hsStyles.card, styles.providerCard]}>
        <View style={styles.row}>
          <View style={[hsStyles.avatar, provider.verified && styles.verifiedRing]}>
            <Text style={hsStyles.avatarText}>{provider.avatarInitial}</Text>
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {provider.name}
              </Text>
              {provider.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              )}
            </View>
            <Text style={hsStyles.muted}>{provider.businessName}</Text>
            {provider.rating > 0 && (
              <View style={hsStyles.ratingRow}>
                <Text style={[hsStyles.starText, styles.ratingStars]}>{renderStars(provider.rating)}</Text>
                <Text style={hsStyles.starText}> {provider.rating.toFixed(1)}</Text>
                <Text style={hsStyles.muted}> ({provider.reviewCount})</Text>
              </View>
            )}
            {provider.experienceYears > 0 && (
              <Text style={hsStyles.muted}>
                📍 {provider.location} · {provider.experienceYears}+ yrs exp
              </Text>
            )}
            {provider.specialties.length > 0 && (
              <View style={styles.tagsRow}>
                {provider.specialties.slice(0, 2).map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={styles.footerRow}>
          <View>
            <Text style={hsStyles.muted}>Start from</Text>
            <Text style={hsStyles.price}>${provider.consultationFee.toFixed(2)}</Text>
          </View>
          <View style={hsStyles.primaryBtn}>
            <Text style={hsStyles.primaryBtnText}>View Details</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HomeServiceProviders: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const user = useSelector((state: any) => state.currentUser);
  const { role } = route.params;
  const [apiProviders, setApiProviders] = useState<HomeCareProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getProvidersByRole(role);
        if (result.error) {
          setError(result.error);
          setApiProviders([]);
        } else {
          setApiProviders(result.providers);
        }
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError('Failed to load providers');
        setApiProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [role, user?.token]);

  const providers = useMemo(() => {
    const list = apiProviders.map(transformProvider);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.businessName.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q),
    );
  }, [apiProviders, query]);

  if (loading) {
    return (
      <View style={[hsStyles.screen, styles.centerContainer]}>
        <ActivityIndicator size="large" color={HS_COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={hsStyles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.primary} />
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>
          {role.toLowerCase() === 'nursing' ? '💉' : '🏥'}
        </Text>
        <Text style={styles.headerTitle}>{capitalizeFirstLetter(role)}</Text>
        <Text style={styles.headerSub}>Browse available professionals</Text>
        <View style={hsStyles.searchBar}>
          <Text>🔍</Text>
          <TextInput
            style={hsStyles.searchInput}
            placeholder="Search providers..."
            placeholderTextColor={HS_COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={hsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={hsStyles.sectionTitle}>
          {providers.length} professional{providers.length !== 1 ? 's' : ''} available
        </Text>
        {providers.map(p => (
          <ProviderCard
            key={p.id}
            provider={p}
            onPress={() =>
              navigation.navigate('ProviderDetails', {
                providerId: p.id,
                role,
              })
            }
          />
        ))}
        {providers.length === 0 && !error && (
          <Text style={styles.empty}>No providers match your search.</Text>
        )}
      </ScrollView>
    </View>
  );
};

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
  header: {
    backgroundColor: HS_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: LAYOUT.borderRadius.xl,
    borderBottomRightRadius: LAYOUT.borderRadius.xl,
  },
  headerEmoji: { fontSize: moderateScale(28), marginBottom: SPACING.xxs, marginTop: SPACING.xs },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#FFF',
  },
  headerSub: {
    fontSize: moderateScale(12),
    color: 'rgba(255,255,255,0.85)',
    marginBottom: SPACING.sm,
  },
  providerCard: { padding: SPACING.md },
  row: { flexDirection: 'row' },
  info: { flex: 1, marginLeft: SPACING.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  name: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: HS_COLORS.text,
    flexShrink: 1,
  },
  ratingStars: {
    // letterSpacing: -4,
  },
  verifiedRing: { borderWidth: 2, borderColor: HS_COLORS.accent },
  verifiedBadge: {
    backgroundColor: HS_COLORS.accentSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  verifiedText: { fontSize: moderateScale(9), color: '#047857', fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.xs, gap: 6 },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: { fontSize: moderateScale(10), color: HS_COLORS.textMuted },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: HS_COLORS.border,
  },
  empty: {
    textAlign: 'center',
    color: HS_COLORS.textMuted,
    marginTop: SPACING.xl,
    fontSize: moderateScale(14),
  },
});

export default HomeServiceProviders;
