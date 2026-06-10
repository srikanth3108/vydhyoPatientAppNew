import { StyleSheet } from 'react-native';
import { LAYOUT, SPACING, moderateScale, isTablet } from '../../utils/responsive';

export const HS_COLORS = {
  bg: '#F0F9F6',
  card: '#FFFFFF',
  primary: '#0A3D62',
  primaryLight: '#1B6CA8',
  accent: '#10B981',
  accentSoft: '#D1FAE5',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  star: '#F59E0B',
  danger: '#EF4444',
  gradientStart: '#0A3D62',
  gradientEnd: '#1B8A6B',

};

export const hsStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HS_COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  hero: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: LAYOUT.borderRadius.xl,
    borderBottomRightRadius: LAYOUT.borderRadius.xl,
  },
  heroTitle: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SPACING.xxs,
  },
  heroSubtitle: {
    fontSize: moderateScale(13),
    color: 'rgba(255,255,255,0.85)',
    lineHeight: moderateScale(18),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
    ...LAYOUT.shadow.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: moderateScale(14),
    color: HS_COLORS.text,
    paddingVertical: SPACING.xxs,
  },
  card: {
    backgroundColor: HS_COLORS.card,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: HS_COLORS.border,
    ...LAYOUT.shadow.sm,
  },
  cardPressed: {
    borderColor: HS_COLORS.primaryLight,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: HS_COLORS.accentSoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  badgeText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#047857',
  },
  primaryBtn: {
    backgroundColor: HS_COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    minHeight: moderateScale(44),
    ...LAYOUT.shadow.md,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: HS_COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: HS_COLORS.primary,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: HS_COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  footer: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: HS_COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: HS_COLORS.border,
  },
  avatar: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: HS_COLORS.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xxs,
  },
  starText: {
    fontSize: moderateScale(12),
    color: HS_COLORS.star,
    fontWeight: '600',
    marginLeft: SPACING.xxs,
  },
  muted: {
    fontSize: moderateScale(12),
    color: HS_COLORS.textMuted,
  },
  price: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: HS_COLORS.primary,
  },
  
});
