import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ImageBackground,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RENTAL_CATEGORIES, RentalCategory } from '../../data/mockRentalCategories';
import { HS_COLORS } from '../homeservices/homeServiceTheme';
import {
  verticalScale,
  moderateScale,
  SAFE_AREA,
  SPACING,
  LAYOUT,
  isTablet,
} from '../../utils/responsive';
import { lang } from 'moment';


type NavList = {
  RentalCategories: undefined;
  RentalAgents: { categoryId: string };
};

type Nav = StackNavigationProp<NavList, 'RentalCategories'>;

const CategoryCard: React.FC<{
  category: RentalCategory;
  onPress: () => void;
}> = ({ category, onPress }) => {


  if (category.image) {
    return (
      <TouchableOpacity activeOpacity={0.92} style={styles.gridItem} onPress={onPress}>
        <View style={styles.categoryCard}>
          <ImageBackground
            source={category.image}
            style={styles.cardImage}
            imageStyle={styles.cardImageRadius}
          >
            <View style={styles.cardImageOverlay}>
              <View style={styles.cardTopRow}>
                <View style={styles.emojiBadge}>
                  <Text style={styles.emoji}>{category.emoji}</Text>
                </View>
                {/* <View style={styles.agentCountBadge}>
                  <Text style={styles.agentCountText}>
                    {category.agentCount} agents
                  </Text>
                </View> */}
              </View>

              <View style={styles.cardBottomContent}>
                <Text style={styles.catTitle} numberOfLines={1}>
                  {category.name}
                </Text>
                <Text style={styles.catTagline} numberOfLines={2}>
                  {category.tagline}
                </Text>
                <View style={styles.exploreRow}>
                  <Text style={styles.exploreText}>Explore →</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>
      </TouchableOpacity>
    );
  }


};

const RentalCategories: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [searchQuery, setSearchQuery] = useState('');

  // Clear search query if needed
  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const filtered = RENTAL_CATEGORIES.filter(category =>
      category.name.toLowerCase().includes(text.toLowerCase())
    );
    // setCategories(filtered);
    
  };

  const renderItem = ({ item }: { item: RentalCategory }) => (
    <CategoryCard
      category={item}
      onPress={() => navigation.navigate('RentalAgents', { categoryId: item.id })}
    />
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.gradientStart} />

      {/* Hero Header */}
      <View style={styles.heroGradient}>
        <Text style={styles.heroTitle}>Rent Medical Equipment</Text>
        <Text style={styles.heroSubtitle}>
          Trusted equipment delivered to your doorstep. Browse categories below.
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statEmoji}>🧼</Text>
            <Text style={styles.statLabel}>Sanitized</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statEmoji}>🚀</Text>
            <Text style={styles.statLabel}>Fast Delivery</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statEmoji}>🛡️</Text>
            <Text style={styles.statLabel}>24×7 Support</Text>
          </View>
        </View>
      </View>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Medical Equipment by Name"
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Category Grid */}
      <FlatList
        data={RENTAL_CATEGORIES}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: SAFE_AREA.safeBottom + 20 },
        ]}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Choose a category</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: verticalScale(10),
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  searchIcon: {
    fontSize: moderateScale(18),
    marginRight: SPACING.sm,
    color: '#9CA3AF',
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#0F172A',
  },
  clearButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  clearIcon: {
    fontSize: moderateScale(14),
    color: '#9CA3AF',
  },
  heroGradient: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(20),
    borderBottomLeftRadius: LAYOUT.borderRadius.xl,
    borderBottomRightRadius: LAYOUT.borderRadius.xl,
    backgroundColor: HS_COLORS.gradientStart,
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
  statsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: moderateScale(18),
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  gridItem: {
    flex: 0.485,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...LAYOUT.shadow.sm,
  },
  cardImage: {
    height: verticalScale(170),
    justifyContent: 'flex-end',
  },
  cardImageRadius: {
    borderRadius: LAYOUT.borderRadius.lg,
  },
  cardImageOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  emojiBadge: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: moderateScale(18),
  },
  agentCountBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  agentCountText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#047857',
  },
  cardBottomContent: {
    marginTop: SPACING.xxl,
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
    marginBottom: SPACING.xs,
  },
  exploreRow: {
    marginTop: SPACING.xs,
  },
  exploreText: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  plainCard: {
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    height: verticalScale(170),
    justifyContent: 'space-between',
  },
  plainCardBottom: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: SPACING.xs,
  },
});

export default RentalCategories;
