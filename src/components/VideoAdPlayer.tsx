import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Video, { OnProgressData, OnLoadData } from 'react-native-video';
import { moderateScale, responsiveWidth } from '../utils/responsive';

interface VideoAdPlayerProps {
  videoSource: any;
  title?: string;
}

const VideoAdPlayer: React.FC<VideoAdPlayerProps> = ({ videoSource, title }) => {
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<Video>(null);

  const onProgress = (data: OnProgressData) => {
    if (data.playableDuration > 0) {
      setProgress(data.currentTime / data.playableDuration);
    }
  };

  const onLoad = (data: OnLoadData) => {
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.adBadge}>AD</Text>
        {title && <Text style={styles.title}>{title}</Text>}
      </View>

      <View style={styles.videoWrapper}>
        <Video
          ref={videoRef}
          source={typeof videoSource === 'string' ? { uri: videoSource } : videoSource}
          style={styles.video}
          resizeMode="cover"
          paused={paused}
          muted={muted}
          repeat={true}
          onProgress={onProgress}
          onLoad={onLoad}
          playInBackground={false}
          playWhenInactive={false}
        />

        {loading && (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color="#AEEED3" />
          </View>
        )}

        <TouchableOpacity 
          style={styles.overlayTouch} 
          onPress={() => setPaused(!paused)}
          activeOpacity={1}
        >
          {!paused && !loading && (
            <View style={styles.controlsRow}>
               <TouchableOpacity style={styles.controlBtn} onPress={() => setMuted(!muted)}>
                <Text style={styles.controlText}>{muted ? '🔇' : '🔊'}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {paused && (
            <View style={styles.playIconContainer}>
               <Text style={styles.playIcon}>▶</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(10),
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(10),
    backgroundColor: '#fff',
  },
  adBadge: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    fontSize: moderateScale(10),
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  title: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#00203F',
  },
  videoWrapper: {
    width: '100%',
    height: moderateScale(150),
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  centerLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: '#fff',
    fontSize: 30,
    marginLeft: 5,
  },
  controlsRow: {
    position: 'absolute',
    bottom: 15,
    right: 15,
  },
  controlBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  controlText: { fontSize: 18 },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#AEEED3',
  },
});

export default VideoAdPlayer;