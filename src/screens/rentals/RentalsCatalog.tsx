import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RENTAL_PRODUCTS, RentalProduct } from '../../data/mockRentals';
import { getAgentById, getCategoryById } from '../../data/mockRentalCategories';
import { HS_COLORS } from '../homeservices/homeServiceTheme';
import { LAYOUT, SPACING, moderateScale, SAFE_AREA, isTablet } from '../../utils/responsive';

type NavList = {
  RentalsCatalog: { categoryId?: string; agentId?: string };
  RentalProductDetails: { productId: string };
};

type RouteParams = RouteProp<NavList, 'RentalsCatalog'>;
type Nav = StackNavigationProp<NavList, 'RentalsCatalog'>;

const ProductCard: React.FC<{
  product: RentalProduct;
  onPress: () => void;
}> = ({ product, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
      <View style={styles.card}>
        <Image source={product.thumbnail} style={styles.thumb} />
        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {product.name}
            </Text>
            <View
              style={[
                styles.pill,
                { backgroundColor: product.availableNow ? '#DCFCE7' : '#FEF3C7' },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: product.availableNow ? '#166534' : '#92400E' },
                ]}
              >
                {product.availableNow ? `ETA ${product.etaMinutes}m` : 'Pre-book'}
              </Text>
            </View>
          </View>
          <Text style={styles.desc} numberOfLines={2}>
            {product.shortDescription}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.rating}>
              ★ {product.rating} <Text style={styles.muted}>({product.reviewCount})</Text>
            </Text>
            <Text style={styles.price}>
              ₹{product.hourlyRate}/hr · ₹{product.dailyRate}/day
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const RentalsCatalog: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteParams>();
  const { categoryId, agentId } = route.params || {};

  const agent = useMemo(() => (agentId ? getAgentById(agentId) : null), [agentId]);
  const category = useMemo(() => (categoryId ? getCategoryById(categoryId) : null), [categoryId]);

  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    let filtered = RENTAL_PRODUCTS;

    if (agent) {
      if (agent.productIds && agent.productIds.length > 0) {
        filtered = filtered.filter(p => agent.productIds.includes(p.id));
      } else if (categoryId) {
        filtered = filtered.filter(p => p.categoryId === categoryId);
      }
    } else if (categoryId) {
      filtered = filtered.filter(p => p.categoryId === categoryId);
    }

    const q = query.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(p => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [query, categoryId, agentId, agent]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.primary} />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          {agent ? agent.name : category ? category.name : 'Rent Homecare Products'}
        </Text>
        <Text style={styles.heroSub}>
          {agent 
            ? `Providing high quality equipment with verified delivery in ${agent.deliveryETA}.`
            : 'Trusted equipment delivered to your doorstep. Choose hours or days, pay securely.'}
        </Text>

        <View style={styles.search}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>Sanitized</Text>
            <Text style={styles.statLabel}>Before dispatch</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>Fast</Text>
            <Text style={styles.statLabel}>Doorstep delivery</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>Support</Text>
            <Text style={styles.statLabel}>Setup help</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          {items.length} product{items.length !== 1 ? 's' : ''} available
        </Text>

        {items.map(p => (
          <ProductCard
            key={p.id}
            product={p}
            onPress={() => navigation.navigate('RentalProductDetails', { productId: p.id })}
          />
        ))}

        {items.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matching products found.</Text>
          </View>
        )}

        <View style={{ height: SAFE_AREA.safeBottom }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F9F6' },
  hero: {
    backgroundColor: HS_COLORS.primary,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: LAYOUT.borderRadius.xl,
    borderBottomRightRadius: LAYOUT.borderRadius.xl,
  },
  heroTitle: { fontSize: moderateScale(20), fontWeight: '800', color: '#FFF' },
  heroSub: {
    fontSize: moderateScale(12),
    color: 'rgba(255,255,255,0.85)',
    lineHeight: moderateScale(17),
    marginTop: SPACING.xxs,
  },
  search: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: { color: '#FFF', marginRight: SPACING.sm, fontSize: moderateScale(14) },
  searchInput: { flex: 1, color: '#FFF', fontSize: moderateScale(14), paddingVertical: 0 },
  scrollContent: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: { fontSize: moderateScale(12), fontWeight: '800', color: HS_COLORS.primary },
  statLabel: { fontSize: moderateScale(10), color: '#64748B', marginTop: 2 },
  sectionTitle: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  thumb: { width: moderateScale(84), height: moderateScale(84), borderRadius: 0 },
  cardBody: { flex: 1, padding: SPACING.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { flex: 1, fontSize: moderateScale(14), fontWeight: '800', color: '#0F172A', marginRight: SPACING.sm },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: moderateScale(10), fontWeight: '700' },
  desc: { marginTop: 4, fontSize: moderateScale(12), color: '#475569', lineHeight: moderateScale(16) },
  metaRow: { marginTop: SPACING.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rating: { fontSize: moderateScale(12), color: '#0F172A', fontWeight: '700' },
  muted: { fontSize: moderateScale(11), color: '#64748B', fontWeight: '600' },
  price: { fontSize: moderateScale(12), color: HS_COLORS.primary, fontWeight: '800' },
  emptyContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: '#64748B',
  },
});

export default RentalsCatalog;

