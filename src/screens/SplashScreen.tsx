import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '@/theme';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo + title fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle
      Animated.timing(subtitleFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Tagline
      Animated.timing(taglineFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Hold and finish
      Animated.delay(600),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient emulation */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>✨</Text>
        </View>
        <Text style={styles.appName}>Layra AI</Text>
      </Animated.View>

      <Animated.Text style={[styles.subtitle, { opacity: subtitleFade }]}>
        你的智能 AI 伴侣
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { opacity: taglineFade }]}>
        聊天 · 创作 · 陪伴
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    top: '15%',
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(236, 72, 153, 0.06)',
    bottom: '20%',
    left: -60,
  },
  bgCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
    top: '40%',
    left: '20%',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  logoEmoji: {
    fontSize: 44,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
    marginTop: 12,
    fontWeight: '500',
  },
  tagline: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginTop: 24,
    letterSpacing: 4,
  },
});