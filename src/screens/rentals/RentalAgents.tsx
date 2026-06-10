import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getAgentsByCategory, getCategoryById, RentalAgent } from '../../data/mockRentalCategories';
import { HS_COLORS } from '../homeservices/homeServiceTheme';
import {
  verticalScale,
  moderateScale,
  SAFE_AREA,
  SPACING,
  LAYOUT,
  isTablet,
} from '../../utils/responsive';

type NavList = {
  RentalAgents: { categoryId: string };
  RentalsCatalog: { categoryId?: string; agentId?: string };
};

type RouteParams = RouteProp<NavList, 'RentalAgents'>;
type Nav = StackNavigationProp<NavList, 'RentalAgents'>;

const AgentCard: React.FC<{
  agent: RentalAgent;
  onPress: () => void;
}> = ({ agent, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.92} style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>{agent.avatar}</Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.agentName} numberOfLines={1}>
              {agent.name}
            </Text>
            {agent.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.agentTagline} numberOfLines={1}>
            {agent.tagline}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={styles.statVal}>★ {agent.rating}</Text>
          <Text style={styles.statLbl}>{agent.reviewCount} Reviews</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statVal}>{agent.deliveryETA}</Text>
          <Text style={styles.statLbl}>Delivery ETA</Text>
        </View>
        <View style={styles.statCol}>
          <Text style={styles.statVal}>{agent.yearsExp} Yrs</Text>
          <Text style={styles.statLbl}>Experience</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.actionBtnText}>View Available Products</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const RentalAgents: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteParams>();
  const { categoryId } = route.params;

  const category = useMemo(() => getCategoryById(categoryId), [categoryId]);
  const agents = useMemo(() => getAgentsByCategory(categoryId), [categoryId]);

  const renderItem = ({ item }: { item: RentalAgent }) => (
    <AgentCard
      agent={item}
      onPress={() =>
        navigation.navigate('RentalsCatalog', {
          categoryId: categoryId,
          agentId: item.id,
        })
      }
    />
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.gradientStart} />

      {/* Hero Header */}
      <View style={styles.heroGradient}>
        <View style={styles.heroRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryEmoji}>{category?.emoji || '♿'}</Text>
          </View>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>{category?.name || 'Rentals'}</Text>
            <Text style={styles.heroSubtitle}>
              {category?.tagline || 'Select a certified provider below'}
            </Text>
          </View>
        </View>
      </View>

      {/* Agent List */}
      <FlatList
        data={agents}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: SAFE_AREA.safeBottom + 20 },
        ]}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>
            Available Agents ({agents.length})
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏪</Text>
            <Text style={styles.emptyText}>No rental agents available in this category currently.</Text>
          </View>
        }
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0F9F6',
  },
  heroGradient: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(20),
    borderBottomLeftRadius: LAYOUT.borderRadius.xl,
    borderBottomRightRadius: LAYOUT.borderRadius.xl,
    backgroundColor: HS_COLORS.gradientStart,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  categoryEmoji: {
    fontSize: moderateScale(26),
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: moderateScale(12),
    color: 'rgba(255,255,255,0.85)',
    lineHeight: moderateScale(16),
  },
  listContent: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...LAYOUT.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#F0F9F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarEmoji: {
    fontSize: moderateScale(24),
  },
  headerInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agentName: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: SPACING.xs,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: '#166534',
  },
  agentTagline: {
    fontSize: moderateScale(11),
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  statLbl: {
    fontSize: moderateScale(10),
    color: '#64748B',
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: HS_COLORS.primary,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyEmoji: {
    fontSize: moderateScale(48),
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: moderateScale(14),
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});

export default RentalAgents;
