// components/Dashboard/Header.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { useSelector } from 'react-redux';

interface HeaderProps {
  onMenuPress: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuPress }) => {
  const currentUserDetails = useSelector((state: any) => state.currentUser);

  return (
    <>
      <StatusBar backgroundColor="#1E40AF" barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hi {currentUserDetails?.firstname}</Text>
            <Text style={styles.headerTitle}>Find Your Doctor</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.icon}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.icon}>📅</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search....."
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.cancelButton}>
            <Text style={styles.cancelIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#00203F',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: '#AEEED3',
    fontSize: 16,
    opacity: 0.9,
  },
  headerTitle: {
    color: '#AEEED3',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 15,
    padding: 5,
  },
  icon: {
    fontSize: 20,
    color: '#fff',
  },
  profileButton: {
    marginLeft: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 18,
    color: '#fff',
  },
  menuButton: {
    marginLeft: 15,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    backgroundColor: '#fff',
    marginVertical: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 3,
    marginBottom: 15,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: '#333',
    marginLeft: 10,
  },
  searchIcon: {
    fontSize: 18,
    color: '#999',
  },
  cancelButton: {
    padding: 5,
  },
  cancelIcon: {
    fontSize: 16,
    color: '#999',
  },
});

export default Header;