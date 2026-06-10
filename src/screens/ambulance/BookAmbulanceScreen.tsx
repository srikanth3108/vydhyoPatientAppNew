import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const BookAmbulanceScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        {/* <Ionicons name="medkit-outline" size={80} color="#fff" /> */}
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.subtitle}>
          Book Ambulance Service is on its way!
        </Text>
        <Text style={styles.description}>
          We're working hard to bring you a seamless ambulance booking experience. Stay tuned for updates!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e01f1fff',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 20,
    color: '#181111ff',
    marginTop: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#e81515ff',
    marginTop: 15,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 24,
  },
});

export default BookAmbulanceScreen