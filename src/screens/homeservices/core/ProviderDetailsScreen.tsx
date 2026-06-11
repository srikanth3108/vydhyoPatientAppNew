import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {
  getProviderDetailsById,
  HomeCareProvider,
} from '../../../services/homeCareService';
import {useSelector} from 'react-redux';
import {HS_COLORS, hsStyles} from '../homeServiceTheme';
import {
  SPACING,
  moderateScale,
  LAYOUT,
  SAFE_AREA,
} from '../../../utils/responsive';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface ProviderReview {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
}

type Params = {providerId: string; role: string};
type NavList = {
  ProviderDetails: Params;
  HomeServiceSlotSelection: Params;
};

type Route = RouteProp<NavList, 'ProviderDetails'>;
type Nav = StackNavigationProp<NavList, 'ProviderDetails'>;

const StarRating: React.FC<{rating: number; size?: number}> = ({
  rating,
  size = 14,
}) => {
  const stars = Array.from({length: 5}, (_, i) => i + 1).map(i => {
    if (i <= Math.floor(rating)) return '★';
    if (i - 0.5 <= rating) return '⯨';
    return '☆';
  });
  return (
    <Text style={{fontSize: moderateScale(size), color: HS_COLORS.star}}>
      {stars.join('')}
    </Text>
  );
};

const RatingBreakdown: React.FC<{rating: number; reviewCount: number}> = ({
  rating,
  reviewCount,
}) => {
  const distribution = [
    {stars: 5, percent: 70},
    {stars: 4, percent: 20},
    {stars: 3, percent: 7},
    {stars: 2, percent: 2},
    {stars: 1, percent: 1},
  ];

  return (
    <View style={styles.ratingBreakdown}>
      <View style={styles.ratingHeader}>
        <View>
          <Text style={styles.ratingValue}>{rating}</Text>
          <View style={styles.starRow}>
            <StarRating rating={rating} size={18} />
          </View>
          <Text style={styles.reviewCountSmall}>{reviewCount} reviews</Text>
        </View>
      </View>

      <View style={styles.distributionContainer}>
        {distribution.map(dist => (
          <View key={dist.stars} style={styles.distributionRow}>
            <Text style={styles.starLabel}>{dist.stars} ★</Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.barFill,
                  {width: `${dist.percent}%`, backgroundColor: HS_COLORS.star},
                ]}
              />
            </View>
            <Text style={styles.percentText}>{dist.percent}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const ReviewCard: React.FC<{review: ProviderReview}> = ({review}) => (
  <View style={[hsStyles.card, styles.reviewCard]}>
    <View style={styles.reviewHeader}>
      <View style={styles.reviewAuthor}>
        <View
          style={[
            styles.reviewAvatar,
            {backgroundColor: HS_COLORS.primaryLight + '20'},
          ]}>
          <Text style={styles.reviewAvatarText}>
            {review.authorName.charAt(0)}
          </Text>
        </View>
        <View style={{flex: 1}}>
          <View style={styles.nameRating}>
            <Text style={styles.reviewAuthorName}>{review.authorName}</Text>
            {review.verified && (
              <Text style={styles.verifiedBadge}>✓ Verified</Text>
            )}
          </View>
          <View style={styles.reviewMeta}>
            <StarRating rating={review.rating} size={12} />
            <Text style={styles.reviewDate}>{formatDate(review.date)}</Text>
          </View>
        </View>
      </View>
    </View>
    <Text style={styles.reviewTitle}>{review.title}</Text>
    <Text style={styles.reviewComment}>{review.comment}</Text>
    <View style={styles.reviewFooter}>
      <Text style={styles.helpfulText}>👍 {review.helpful} found helpful</Text>
    </View>
  </View>
);

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const daysAgo = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 30) return `${daysAgo} days ago`;
  if (daysAgo < 365) {
    const monthsAgo = Math.floor(daysAgo / 30);
    return `${monthsAgo} month${monthsAgo > 1 ? 's' : ''} ago`;
  }
  return date.toLocaleDateString();
};

const ProviderDetailsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {providerId, role} = route.params;
  const user = useSelector((state: any) => state.currentUser);

  const [provider, setProvider] = useState<HomeCareProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Fetch provider details on mount
  useEffect(() => {
    const fetchProvider = async () => {
      try {
        setLoading(true);
        const result = await getProviderDetailsById(providerId);
        if (result.error) {
          setError(result.error);
          setProvider(null);
        } else {
          setProvider(result.provider);
        }
      } catch (err) {
        console.error('Error fetching provider:', err);
        setError('Failed to load provider details');
        setProvider(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [providerId, user?.token]);

  // Show loading state
  if (loading) {
    return (
      <View style={[hsStyles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={HS_COLORS.primary} />
      </View>
    );
  }

  // Show error state
  if (error || !provider) {
    return (
      <View style={[hsStyles.screen, styles.centered]}>
        <Text style={styles.errorText}>{error || 'Provider not found'}</Text>
      </View>
    );
  }

  // Transform API data to match component expectations
  const displayProvider = {
    id: provider._id,
    name: provider.fullName,
    businessName: provider.profession,
    rating: provider.overallRating || 0,
    reviewCount: provider.totalReviews || 0,
    experienceYears: provider.totalExperience || 0,
    location: provider.homeAddress.split(',')[0] || 'Location',
    consultationFee: provider.consultationFee || 0,
    distance: '~0 km',
    verified:
      provider.verificationStatus === 'reviewing' ||
      provider.verificationStatus === 'verified',
    avatarInitial: provider.fullName.charAt(0).toUpperCase(),
    specialties: provider.selectedServices || [],
    startingPrice: provider.consultationFee || 0,
  };

  return (
    <View style={hsStyles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.primary} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom:
            moderateScale(120) +
            (Platform.OS === 'android'
              ? Math.max(insets.bottom, SAFE_AREA.safeBottom)
              : insets.bottom),
        }}>
        <View style={styles.headerBg}>
          <View style={styles.profileHeader}>
            <View
              style={[
                hsStyles.avatar,
                {width: moderateScale(72), height: moderateScale(72)},
              ]}>
              <Text
                style={{
                  fontSize: moderateScale(32),
                  fontWeight: '700',
                  color: HS_COLORS.primary,
                }}>
                {displayProvider.avatarInitial}
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.providerName}>{displayProvider.name}</Text>
                {displayProvider.verified && (
                  <View style={styles.verifiedBadgeLarge}>
                    <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.businessName}>
                {displayProvider.businessName}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {displayProvider.experienceYears}+
                  </Text>
                  <Text style={styles.statLabel}>Years exp.</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {displayProvider.specialties?.length || 0}
                  </Text>
                  <Text style={styles.statLabel}>Services</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {displayProvider.reviewCount}
                  </Text>
                  <Text style={styles.statLabel}>Reviews</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.locationSection}>
            <Text style={styles.locationText}>
              📍 {displayProvider.location}
            </Text>
            <Text style={styles.distanceText}>
              {displayProvider.distance} away
            </Text>
          </View>
        </View>

        <View style={styles.quickInfoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>⭐</Text>
            <View>
              <Text style={styles.infoLabel}>Rating</Text>
              <Text style={styles.infoValue}>{displayProvider.rating} / 5</Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📧</Text>
            <View>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {provider.email.substring(0, 12)}
                {provider.email.length > 12 ? '...' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📱</Text>
            <View>
              <Text style={styles.infoLabel}>Mobile</Text>
              <Text style={styles.infoValue}>{provider.mobile}</Text>
            </View>
          </View>
        </View>

        {(provider.highestQualification ||
          provider.specialization ||
          provider.profession) && (
          <View style={styles.sectionContainer}>
            <Text style={[hsStyles.sectionTitle, {marginBottom: SPACING.md}]}>
              Professional Details
            </Text>
            <View style={styles.pillRow}>
              {provider.profession && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>✓ {provider.profession}</Text>
                </View>
              )}
              {provider.highestQualification && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>
                    ✓ {provider.highestQualification}
                  </Text>
                </View>
              )}
              {provider.specialization && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>
                    ✓ {provider.specialization}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.sectionContainer}>
          <Text style={[hsStyles.sectionTitle, {marginBottom: SPACING.md}]}>
            Specialties
          </Text>
          <View style={styles.specialtiesRow}>
            {displayProvider.specialties.map(spec => (
              <View key={spec} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{spec}</Text>
              </View>
            ))}
          </View>
        </View>

        {provider.documents && provider.documents.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[hsStyles.sectionTitle, {marginBottom: SPACING.md}]}>
              Documents
            </Text>
            {provider.documents.map((doc, idx) => (
              <View key={idx} style={styles.certificationItem}>
                <Text style={styles.certIcon}>📄</Text>
                <Text style={styles.certText}>{doc.documentType}</Text>
              </View>
            ))}
          </View>
        )}

        {(provider.gender ||
          provider.dateOfBirth ||
          provider.totalExperience) && (
          <View style={styles.sectionContainer}>
            <Text style={[hsStyles.sectionTitle, {marginBottom: SPACING.md}]}>
              Personal Details
            </Text>
            {provider.gender && (
              <View style={styles.availCard}>
                <Text style={styles.availLine}>
                  👤 Gender: {provider.gender}
                </Text>
              </View>
            )}
            {provider.totalExperience && (
              <View style={styles.availCard}>
                <Text style={styles.availLine}>
                  💼 Experience: {provider.totalExperience} years
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.sectionContainer}>
          <RatingBreakdown
            rating={displayProvider.rating}
            reviewCount={displayProvider.reviewCount}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <View style={styles.footerPrice}>
            <Text style={styles.footerLabel}>Fee</Text>
            <Text style={styles.footerValue}>
              ₹{displayProvider.startingPrice}
            </Text>
          </View>
          <TouchableOpacity
            style={[hsStyles.primaryBtn, styles.footerBtn]}
            onPress={() =>
              navigation.navigate('HomeServiceSlotSelection', {
                providerId,
                role,
              })
            }
          >
            <Text style={hsStyles.primaryBtnText}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {justifyContent: 'center', alignItems: 'center'},
  errorText: {
    fontSize: moderateScale(14),
    color: HS_COLORS.text,
    textAlign: 'center',
  },
  headerBg: {
    backgroundColor: HS_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  profileInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: SPACING.xs,
  },
  providerName: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#FFF',
  },
  verifiedBadgeLarge: {
    backgroundColor: HS_COLORS.accentSoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: SPACING.sm,
  },
  verifiedBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#047857',
  },
  businessName: {
    fontSize: moderateScale(12),
    color: 'rgba(255,255,255,0.85)',
    marginBottom: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#FFF',
  },
  statLabel: {
    fontSize: moderateScale(10),
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  locationSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  locationText: {
    fontSize: moderateScale(13),
    color: '#FFF',
    fontWeight: '600',
  },
  distanceText: {
    fontSize: moderateScale(11),
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  quickInfoContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: HS_COLORS.bg,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
  },
  infoIcon: {
    fontSize: moderateScale(20),
    marginRight: SPACING.sm,
  },
  infoLabel: {
    fontSize: moderateScale(10),
    color: HS_COLORS.textMuted,
  },
  infoValue: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: HS_COLORS.text,
  },
  sectionContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: HS_COLORS.bg,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  pill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: LAYOUT.borderRadius.md,
  },
  pillText: {fontSize: moderateScale(11), fontWeight: '700', color: '#047857'},
  smallMuted: {
    fontSize: moderateScale(12),
    color: HS_COLORS.textMuted,
    marginTop: 2,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  specialtyTag: {
    backgroundColor: HS_COLORS.accentSoft,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  specialtyText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#047857',
  },
  aboutText: {
    fontSize: moderateScale(13),
    color: HS_COLORS.text,
    lineHeight: moderateScale(19),
    opacity: 0.95,
  },
  availCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    marginBottom: SPACING.sm,
  },
  availLine: {
    fontSize: moderateScale(12),
    color: HS_COLORS.text,
    marginBottom: 4,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: HS_COLORS.border,
  },
  certIcon: {
    fontSize: moderateScale(16),
    marginRight: SPACING.md,
  },
  certText: {
    fontSize: moderateScale(13),
    color: HS_COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  languagesList: {
    fontSize: moderateScale(13),
    color: HS_COLORS.text,
    fontWeight: '500',
  },
  ratingBreakdown: {
    backgroundColor: '#FFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: HS_COLORS.border,
  },
  ratingValue: {
    fontSize: moderateScale(32),
    fontWeight: '700',
    color: HS_COLORS.primary,
  },
  starRow: {
    marginVertical: SPACING.xs,
  },
  reviewCountSmall: {
    fontSize: moderateScale(11),
    color: HS_COLORS.textMuted,
  },
  distributionContainer: {
    gap: SPACING.sm,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  starLabel: {
    fontSize: moderateScale(12),
    color: HS_COLORS.text,
    width: moderateScale(35),
    fontWeight: '500',
  },
  barContainer: {
    flex: 1,
    height: moderateScale(6),
    backgroundColor: HS_COLORS.border,
    borderRadius: moderateScale(3),
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: moderateScale(3),
  },
  percentText: {
    fontSize: moderateScale(11),
    color: HS_COLORS.textMuted,
    width: moderateScale(32),
    textAlign: 'right',
  },
  reviewCard: {
    marginBottom: SPACING.md,
  },
  reviewHeader: {
    marginBottom: SPACING.sm,
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reviewAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  reviewAvatarText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: HS_COLORS.primary,
  },
  nameRating: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    flex: 1,
  },
  reviewAuthorName: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: HS_COLORS.text,
  },
  verifiedBadge: {
    fontSize: moderateScale(10),
    color: HS_COLORS.accent,
    fontWeight: '600',
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xxs,
  },
  reviewDate: {
    fontSize: moderateScale(11),
    color: HS_COLORS.textMuted,
  },
  reviewTitle: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: HS_COLORS.text,
    marginBottom: SPACING.xs,
  },
  reviewComment: {
    fontSize: moderateScale(12),
    color: HS_COLORS.textMuted,
    lineHeight: moderateScale(18),
    marginBottom: SPACING.sm,
  },
  reviewFooter: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: HS_COLORS.border,
  },
  helpfulText: {
    fontSize: moderateScale(11),
    color: HS_COLORS.textMuted,
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: HS_COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: HS_COLORS.border,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerPrice: {
    width: moderateScale(92),
  },
  footerLabel: {fontSize: moderateScale(11), color: HS_COLORS.textMuted},
  footerValue: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: HS_COLORS.primary,
  },
  footerBtn: {flex: 1, minHeight: moderateScale(44)},
  footerHint: {
    marginTop: SPACING.xs,
    fontSize: moderateScale(11),
    color: HS_COLORS.textMuted,
    textAlign: 'center',
  },
});

export default ProviderDetailsScreen;

