import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  getProviderById,
  getOfferingsByProvider,
  HomeServiceOffering,
} from '../../../data/mockHomeServices';
import { HS_COLORS, hsStyles } from '../homeServiceTheme';
import { SPACING, moderateScale, LAYOUT } from '../../../utils/responsive';

type Params = { providerId: string; categoryId: string };
type NavList = {
  HomeServiceOfferings: Params;
  HomeServiceSlotSelection: Params & { serviceId: string };
};

type Route = RouteProp<NavList, 'HomeServiceOfferings'>;
type Nav = StackNavigationProp<NavList, 'HomeServiceOfferings'>;

const ServiceCard: React.FC<{
  service: HomeServiceOffering;
  onBook: () => void;
}> = ({ service, onBook }) => (
  <View style={[hsStyles.card, styles.serviceCard]}>
    <View style={styles.serviceHeader}>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={styles.serviceName}>{service.name}</Text>
          {service.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}
        </View>
        <Text style={styles.serviceDesc}>{service.description}</Text>
      </View>
    </View>
    <View style={styles.metaRow}>
      <Text style={hsStyles.muted}>⏱ {service.duration}</Text>
      <Text style={hsStyles.price}>₹{service.price}</Text>
    </View>
    <View style={styles.includesBox}>
      {service.includes.map(item => (
        <Text key={item} style={styles.includeItem}>
          ✓ {item}
        </Text>
      ))}
    </View>
    <TouchableOpacity style={[hsStyles.primaryBtn, styles.bookBtn]} onPress={onBook}>
      <Text style={hsStyles.primaryBtnText}>Book Now</Text>
    </TouchableOpacity>
  </View>
);

const HomeServiceOfferings: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { providerId, categoryId } = route.params;
  const provider = getProviderById(providerId);
  const services = getOfferingsByProvider(providerId);

  if (!provider) {
    return (
      <View style={[hsStyles.screen, styles.centered]}>
        <Text>Provider not found</Text>
      </View>
    );
  }

  return (
    <View style={hsStyles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={HS_COLORS.primary} />
      <View style={styles.providerHeader}>
        <View style={hsStyles.avatar}>
          <Text style={hsStyles.avatarText}>{provider.avatarInitial}</Text>
        </View>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{provider.name}</Text>
          <Text style={styles.providerBiz}>{provider.businessName}</Text>
          <Text style={hsStyles.starText}>
            ★ {provider.rating} · {provider.experienceYears} yrs exp.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={hsStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={hsStyles.sectionTitle}>Select a service</Text>
        {services.map(s => (
          <ServiceCard
            key={s.id}
            service={s}
            onBook={() =>
              navigation.navigate('HomeServiceSlotSelection', {
                providerId,
                categoryId,
                serviceId: s.id,
              })
            }
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { justifyContent: 'center', alignItems: 'center' },
  providerHeader: {
    flexDirection: 'row',
    backgroundColor: HS_COLORS.primary,
    padding: SPACING.md,
    borderBottomLeftRadius: LAYOUT.borderRadius.xl,
    borderBottomRightRadius: LAYOUT.borderRadius.xl,
    alignItems: 'center',
  },
  providerInfo: { flex: 1, marginLeft: SPACING.md },
  providerName: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#FFF',
  },
  providerBiz: {
    fontSize: moderateScale(12),
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  serviceCard: { marginBottom: SPACING.md },
  serviceHeader: { marginBottom: SPACING.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  serviceName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: HS_COLORS.text,
    marginRight: SPACING.xs,
  },
  popularBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#B45309',
  },
  serviceDesc: {
    fontSize: moderateScale(13),
    color: HS_COLORS.textMuted,
    marginTop: SPACING.xxs,
    lineHeight: moderateScale(18),
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  includesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  includeItem: {
    fontSize: moderateScale(12),
    color: HS_COLORS.text,
    marginBottom: 4,
  },
  bookBtn: { alignSelf: 'stretch' },
});

export default HomeServiceOfferings;
