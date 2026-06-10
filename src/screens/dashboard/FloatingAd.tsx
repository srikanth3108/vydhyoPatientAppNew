import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Image,
  StyleSheet,
  Easing,
} from 'react-native';
import { useSelector } from 'react-redux';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AD_WIDTH = 200;
const AD_HEIGHT = 280;
const INITIAL_X = screenWidth - AD_WIDTH - 20;
const INITIAL_Y = screenHeight / 2 - AD_HEIGHT / 2;
const ARROW_SIZE = 50;
const BORDER_RADIUS = 20;

// Translations for multiple languages
const translations: any = {
  en: {
    adText: 'Vydhyo!',
    adSubText: 'Connect.Care.Cure',
    ctaText: 'Learn More',
  },
  hi: {
    adText: 'व्याध्यो!',
    adSubText: 'जुड़ें.देखभाल.इलाज',
    ctaText: 'और जानें',
  },
  tel: {
    adText: 'వ్యాధ్యో!',
    adSubText: 'కనెక్ట్.కేర్.క్యూర్',
    ctaText: 'మరింత తెలుసుకోండి',
  },
};

const FloatingAd = () => {
  const [visible, setVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [arrowPosition, setArrowPosition] = useState(null);
  const pan = useRef(new Animated.ValueXY({ x: INITIAL_X, y: INITIAL_Y })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Get user details from Redux for language preference
  const user = useSelector((state: any) => state.currentUser);
  const appLanguage = user?.appLanguage || 'en';
  
  // Pick translation set
  const t = translations[appLanguage] || translations.en;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isMinimized,
      onPanResponderGrant: () => {
        // Scale down slightly when dragging starts
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        let newX = INITIAL_X + gestureState.dx;
        let newY = INITIAL_Y + gestureState.dy;

        newX = Math.max(0, Math.min(newX, screenWidth - AD_WIDTH));
        newY = Math.max(0, Math.min(newY, screenHeight - AD_HEIGHT));

        pan.setValue({ x: newX, y: newY });
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Return to normal scale
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        const finalX = INITIAL_X + gestureState.dx;
        const finalY = INITIAL_Y + gestureState.dy;

        // Determine nearest edge (left, right, top, or bottom)
        const isLeftEdge = finalX < screenWidth * 0.1;
        const isRightEdge = finalX > screenWidth - AD_WIDTH - screenWidth * 0.1;
        const isTopEdge = finalY < screenHeight * 0.1;
        const isBottomEdge = finalY > screenHeight - AD_HEIGHT - screenHeight * 0.1;

        if (isLeftEdge || isRightEdge || isTopEdge || isBottomEdge) {
          setIsMinimized(true);

          let targetX = finalX;
          let targetY = finalY;

          if (isLeftEdge) {
            targetX = -AD_WIDTH + ARROW_SIZE;
            setArrowPosition('right');
          } else if (isRightEdge) {
            targetX = screenWidth - ARROW_SIZE;
            setArrowPosition('left');
          } else if (isTopEdge) {
            targetY = -AD_HEIGHT + ARROW_SIZE;
            setArrowPosition('bottom');
          } else if (isBottomEdge) {
            targetY = screenHeight - ARROW_SIZE;
            setArrowPosition('top');
          }

          Animated.spring(pan, {
            toValue: { x: targetX, y: targetY },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleArrowClick = () => {
    setIsMinimized(false);
    setArrowPosition(null);
    Animated.spring(pan, {
      toValue: { x: INITIAL_X, y: INITIAL_Y },
      useNativeDriver: true,
    }).start();
  };

  const handleClose = () => {
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible) return null;

  const getArrowIcon = () => {
    switch (arrowPosition) {
      case 'right': return '▶';
      case 'left': return '◀';
      case 'top': return '▲';
      case 'bottom': return '▼';
      default: return '▶';
    }
  };

  return (
    <Animated.View
      {...(isMinimized ? {} : panResponder.panHandlers)}
      style={[
        styles.adContainer,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scaleAnim }
          ],
          width: isMinimized ? ARROW_SIZE : AD_WIDTH,
          height: isMinimized ? ARROW_SIZE : AD_HEIGHT,
          opacity: opacityAnim,
        },
      ]}
    >
      {isMinimized ? (
        <TouchableOpacity
          style={[
            styles.arrowContainer,
            arrowPosition === 'right' && styles.arrowRight,
            arrowPosition === 'left' && styles.arrowLeft,
            arrowPosition === 'top' && styles.arrowTop,
            arrowPosition === 'bottom' && styles.arrowBottom,
          ]}
          onPress={handleArrowClick}
          activeOpacity={0.7}
        >
          <Text style={styles.arrowText}>{getArrowIcon()}</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.adContent}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' }}
                style={styles.adImage}
                resizeMode="cover"
              />
              <View style={styles.overlay} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.adText}>{t.adText}</Text>
              <Text style={styles.adSubText}>{t.adSubText}</Text>
              <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
                <Text style={styles.ctaText}>{t.ctaText}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    overflow: 'hidden',
  },
  adContent: {
    flex: 1,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 64, 175, 0.4)',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    width: '100%',
  },
  adText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  adSubText: {
    fontSize: 14,
    color: '#E0E7FF',
    marginBottom: 15,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
  },
  ctaText: {
    color: '#1E40AF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  closeText: {
    fontSize: 16,
    color: '#1E40AF',
    fontWeight: 'bold',
  },
  arrowContainer: {
    flex: 1,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS,
  },
  arrowRight: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  arrowLeft: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  arrowTop: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  arrowBottom: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  arrowText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default FloatingAd;