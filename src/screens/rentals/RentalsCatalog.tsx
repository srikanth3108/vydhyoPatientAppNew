import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getRentalProducts } from '../../services/rentalService';
import { ActivityIndicator } from 'react-native';
import { HS_COLORS } from '../homeservices/homeServiceTheme';
import { LAYOUT, SPACING, moderateScale, SAFE_AREA, verticalScale } from '../../utils/responsive';

type NavList = {
  RentalsCatalog: { categoryId?: string; agentId?: string };
  RentalAgents: { productName: string };
  RentalProductDetails: { productId: string };
};

type RouteParams = RouteProp<NavList, 'RentalsCatalog'>;
type Nav = StackNavigationProp<NavList, 'RentalsCatalog'>;

const { width } = Dimensions.get('window');

const ProductCard: React.FC<{
  product: any;
  onPress: () => void;
}> = ({ product, onPress }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {imgError || !product.imageUrl ? (
            <View style={[styles.thumb, styles.fallbackContainer]}>
              <Text style={styles.fallbackEmoji}>📦</Text>
            </View>
          ) : (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.thumb}
              resizeMode="contain"
              onError={() => setImgError(true)}
            />
          )}
          <View style={styles.etaPill}>
            <Text style={styles.etaText}>⚡ {product.etaText || '35m'}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {product.name}
            </Text>
          </View>
          
          <Text style={styles.desc} numberOfLines={2}>
            {product.description}
          </Text>

          <View style={styles.footerRow}>
            <View>
              <Text style={styles.priceDay}>
                ₹{product.dailyRate}
                <Text style={styles.priceUnit}>/day</Text>
              </Text>
              <Text style={styles.priceHour}>₹{product.hourlyRate}/hour</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ {product.rating || '4.5'}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const RentalsCatalog: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteParams>();
  const categoryId = route.params?.categoryId;

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await getRentalProducts(categoryId, query.trim());
        if (res?.data) {
          setProducts(res.data);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [categoryId, query]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.gradientStart} />
      
      {/* Modern Hero Header */}
      <View style={styles.hero}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search medical equipment..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={query}
            onChangeText={setQuery}
          />
        </View>
        
        {/* Horizontal Scroll Stats */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.statsScroll}
        >
          <View style={styles.statPill}>
            <Text style={styles.statEmoji}>✨</Text>
            <Text style={styles.statLabel}>100% Sanitized</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statEmoji}>🚀</Text>
            <Text style={styles.statLabel}>Express Delivery</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statEmoji}>🛠️</Text>
            <Text style={styles.statLabel}>Free Setup</Text>
          </View>
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={HS_COLORS.primary} />
            <Text style={styles.loaderText}>Finding best equipment...</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Equipment</Text>
              <Text style={styles.itemCount}>{products.length} items</Text>
            </View>

            {products.map(p => (
              <ProductCard
                key={p.productId}
                product={p}
                onPress={() => navigation.navigate('RentalAgents', { productName: p.name })}
              />
            ))}

            {products.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📦</Text>
                <Text style={styles.emptyTitle}>No Equipment Found</Text>
                <Text style={styles.emptyText}>Try adjusting your search criteria</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: SAFE_AREA.safeBottom + 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' // Softer background
  },
  hero: {
    backgroundColor: HS_COLORS.gradientStart,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: LAYOUT.borderRadius.xl,
    borderBottomRightRadius: LAYOUT.borderRadius.xl,
    ...LAYOUT.shadow.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.xl,
    paddingHorizontal: SPACING.md,
    height: verticalScale(45),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchIcon: { 
    fontSize: moderateScale(16), 
    marginRight: SPACING.sm 
  },
  searchInput: { 
    flex: 1, 
    color: '#FFFFFF', 
    fontSize: moderateScale(15), 
    fontWeight: '500' 
  },
  statsScroll: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: 999,
  },
  statEmoji: {
    fontSize: moderateScale(14),
    marginRight: 6,
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  itemCount: {
    fontSize: moderateScale(13),
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.xl,
    flexDirection: 'row',
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  imageContainer: {
    width: width * 0.3,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  thumb: { 
    width: '100%', 
    height: verticalScale(90),
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  fallbackEmoji: {
    fontSize: moderateScale(32),
  },
  etaPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  etaText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: '#047857',
  },
  cardBody: { 
    flex: 1, 
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  name: { 
    flex: 1, 
    fontSize: moderateScale(15), 
    fontWeight: '800', 
    color: '#1E293B',
    marginBottom: 4,
  },
  desc: { 
    fontSize: moderateScale(12), 
    color: '#64748B', 
    lineHeight: moderateScale(16),
    marginBottom: SPACING.sm,
  },
  footerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end',
  },
  priceDay: { 
    fontSize: moderateScale(16), 
    color: HS_COLORS.primary, 
    fontWeight: '800' 
  },
  priceUnit: {
    fontSize: moderateScale(12),
    color: '#64748B',
    fontWeight: '600',
  },
  priceHour: { 
    fontSize: moderateScale(11), 
    color: '#94A3B8', 
    fontWeight: '600',
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: { 
    fontSize: moderateScale(12), 
    color: '#B45309', 
    fontWeight: '800' 
  },
  loaderContainer: {
    paddingVertical: SPACING.xxl * 2,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: SPACING.md,
    color: '#64748B',
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: SPACING.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: moderateScale(48),
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: '#64748B',
  },
});

export default RentalsCatalog;

