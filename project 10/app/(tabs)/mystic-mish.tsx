// apps/tabs/mystic-mish.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import CosmicBackground from '../../components/CosmicBackground';
import CosmicButton from '../../components/CosmicButton';
import HoroscopeHeader from '../../components/HoroscopeHeader';
import { getCurrentMoonPhase } from '../../utils/astronomy';
import { getSubscriptionStatus } from '../../utils/billing';

// Web icons: use lucide-react to avoid RN Web/SVG traps
let MoonIcon: any, StarIcon: any, SparklesIcon: any, EyeIcon: any, ScrollIcon: any, CrownIcon: any;
if (Platform.OS === 'web') {
  const lucide = require('lucide-react');
  MoonIcon = lucide.Moon;
  StarIcon = lucide.Star;
  SparklesIcon = lucide.Sparkles;
  EyeIcon = lucide.Eye;
  ScrollIcon = lucide.Scroll;
  CrownIcon = lucide.Crown;
}

if (typeof Platform === 'undefined') {
  (global as any).Platform = { OS: 'web' };
}

const mishAvatar = require('../../assets/images/mystic-mish/headshot.png');

// -------------- tiny utils for ritual bridge --------------
type RitualPayload = { title: string; body: string; version?: string };

const HALLOWEEN_MARKERS = [
  'Samhain',
  'Veil Walker',
  'thinning veil',
  'Halloween',
  'pumpkin'
];

function isHalloweenish(s: string) {
  const hay = (s || '').toLowerCase();
  return HALLOWEEN_MARKERS.some(m => hay.includes(m.toLowerCase()));
}

function getStoredRitual(): RitualPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('mish.ritual');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RitualPayload;
    if (!parsed?.body) return null;
    if (isHalloweenish(parsed.body)) return null; // block stale halloween
    return parsed;
  } catch {
    return null;
  }
}

// -------------- Component --------------
export default function MysticMishScreen() {
  const router = useRouter();
  const [moonPhase, setMoonPhase] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // live ritual content sent from the floating Mish component
  const [ritual, setRitual] = useState<RitualPayload | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      let subscriptionStatus: any;
      try {
        console.log('🔍 [mystic-mish] Checking subscription status...');
        subscriptionStatus = await getSubscriptionStatus();
        console.log('🔍 [mystic-mish] Subscription result:', subscriptionStatus);

        setMoonPhase(getCurrentMoonPhase());
      } catch (error) {
        console.error('Error loading Mystic Mish data:', error);
      } finally {
        if (isMounted) {
          if (subscriptionStatus) setHasAccess(!!subscriptionStatus.active);
          setLoading(false);
        }
      }
    };

    loadData();

    // tiny listener: pick up most recent ritual from storage, and subscribe to push events
    const prime = getStoredRitual();
    if (prime) setRitual(prime);

    const onRitual = (e: any) => {
      const detail = (e && e.detail) as RitualPayload | undefined;
      if (detail?.body && !isHalloweenish(detail.body)) {
        setRitual(detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mish:ritual', onRitual as EventListener);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('mish:ritual', onRitual as EventListener);
      }
    };
  }, []);

  const handleUpgrade = () => router.push('/subscription');
  const handleSettings = () => router.push('/(tabs)/settings');
  const handleAccount = () => router.push('/settings');

  const tips = useMemo(() => ([
    {
      icon: Platform.OS === 'web' ? <MoonIcon size={20} /> : <Text>🌙</Text>,
      title: 'Moon Phase Magic',
      tip: 'New moons set intentions, full moons release and manifest. Waxing grows, waning lets go.'
    },
    {
      icon: Platform.OS === 'web' ? <SparklesIcon size={20} /> : <Text>✨</Text>,
      title: 'Cusp Power',
      tip: 'On a cusp you can work with both signs. Blend ruling planets and elements for stronger work.'
    },
    {
      icon: Platform.OS === 'web' ? <StarIcon size={20} /> : <Text>⭐</Text>,
      title: 'Daily Practice',
      tip: 'Small daily rituals beat rare big ones. Light a candle with intention or speak an affirmation.'
    }
  ]), []);

  if (loading) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#d4af37" />
            <Text style={styles.loadingText}>Loading mystical wisdom...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={styles.container}>
        <CosmicBackground />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerCenter}>
              <Text style={styles.title}>Mystic Mish</Text>
              <Text style={styles.subtitle}>Your Cosmic Guide & Ritual Keeper</Text>
            </View>

            <LinearGradient
              colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
              style={styles.paywallCard}
            >
              <View style={styles.paywallHeader}>
                {Platform.OS === 'web' ? <CrownIcon size={32} /> : <Text style={{fontSize:28}}>👑</Text>}
                <Text style={styles.paywallTitle}>Unlock Mystic Mish</Text>
              </View>

              <Text style={styles.paywallDescription}>
                Access Mystic Mish spells, moon rituals, and cosmic wisdom with Astral Plane.
              </Text>

              <View style={styles.mishPreviewContainer}>
                <Image
                  source={mishAvatar}
                  style={styles.mishPreviewImage}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
                {imageError && (
                  <View style={styles.mishPreviewFallback}>
                    <Text style={styles.mishEmojiLarge}>🔮</Text>
                    <Text style={styles.mishNameLarge}>Mish</Text>
                  </View>
                )}
              </View>

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  {Platform.OS === 'web' ? <ScrollIcon size={16} /> : <Text>📜</Text>}
                  <Text style={styles.featureText}>Sacred spells and rituals</Text>
                </View>
                <View className="featureItem" style={styles.featureItem}>
                  {Platform.OS === 'web' ? <MoonIcon size={16} /> : <Text>🌙</Text>}
                  <Text style={styles.featureText}>Moon phase guidance</Text>
                </View>
                <View style={styles.featureItem}>
                  {Platform.OS === 'web' ? <SparklesIcon size={16} /> : <Text>✨</Text>}
                  <Text style={styles.featureText}>Cusp specific practices</Text>
                </View>
                <View style={styles.featureItem}>
                  {Platform.OS === 'web' ? <EyeIcon size={16} /> : <Text>👁️</Text>}
                  <Text style={styles.featureText}>Mystic tips</Text>
                </View>
              </View>

              <CosmicButton
                title="Upgrade to Astral Plane"
                onPress={handleUpgrade}
                style={styles.upgradeButton}
              />
            </LinearGradient>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CosmicBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerIcon}>✨</Text>
            <Text style={styles.headerTitle}>Mystic Mish</Text>
            <Text style={styles.headerSubtitle}>Your Cosmic Guide & Ritual Keeper</Text>
          </View>

          {/* Welcome + Avatar */}
          <LinearGradient
            colors={['rgba(212, 175, 55, 0.2)', 'rgba(139, 157, 195, 0.1)']}
            style={styles.welcomeCard}
          >
            <View style={styles.mishAvatarContainer}>
              <Image
                source={mishAvatar}
                style={styles.mishAvatar}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
              {imageError && (
                <View style={styles.mishAvatarFallback}>
                  <Text style={styles.mishEmojiLarge}>🔮</Text>
                  <Text style={styles.mishNameLarge}>Mish</Text>
                </View>
              )}
            </View>

            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>Welcome, cosmic soul!</Text>
              <Text style={styles.welcomeText}>
                I am Mystic Mish. I appear when the sky is ripe for magic and ritual work. Tap the floating Mish on the daily page to push today’s rite here instantly.
              </Text>
            </View>
          </LinearGradient>

          {/* Seasonal header */}
          <LinearGradient
            colors={['rgba(139, 157, 195, 0.25)', 'rgba(75, 0, 130, 0.15)']}
            style={styles.moonMessageCard}
          >
            <View style={styles.moonHeader}>
              {Platform.OS === 'web' ? <MoonIcon size={24} /> : <Text style={{fontSize:20}}>🌙</Text>}
              <Text style={styles.moonTitle}>Seasonal Rituals</Text>
            </View>
            {moonPhase && (
              <Text style={styles.moonPhaseText}>
                Current Moon: {moonPhase.phase} ({moonPhase.illumination}% illuminated)
              </Text>
            )}
            <Text style={styles.moonMessage}>
              Southern: spring builds toward summer • Northern: autumn deepens toward winter
            </Text>
            <Text style={styles.moonDescription}>
              The tab below shows the latest pushed rite. If it looks like Halloween, it will be ignored.
            </Text>
          </LinearGradient>

          {/* Live ritual block from listener */}
          {ritual ? (
            <View style={styles.spellsSection}>
              <Text style={styles.sectionTitle}>{ritual.title || 'Mystic Mish Rite'}</Text>
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.1)']}
                style={styles.spellCard}
              >
                <View style={styles.spellHeader}>
                  {Platform.OS === 'web' ? <ScrollIcon size={20} /> : <Text>📜</Text>}
                  <Text style={styles.spellTitle}>{ritual.title || 'Spell'}</Text>
                </View>
                <View style={styles.fullSpellContainer}>
                  <Text style={styles.fullSpellText}>{ritual.body}</Text>
                </View>
                {ritual.version ? (
                  <Text style={{ color: '#8b9dc3', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                    {ritual.version}
                  </Text>
                ) : null}
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.spellsSection}>
              <Text style={styles.sectionTitle}>Mystic Mish Rite</Text>
              <LinearGradient
                colors={['rgba(139, 157, 195, 0.15)', 'rgba(139, 157, 195, 0.05)']}
                style={styles.spellCard}
              >
                <View style={styles.fullSpellContainer}>
                  <Text style={styles.fullSpellText}>
                    Tap the floating Mish on the Daily page to reveal today’s rite. If a rite was already sent, reload this tab.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>Mish’s Cosmic Tips</Text>
            {tips.map((tip) => (
              <LinearGradient
                key={tip.title}
                colors={['rgba(139, 157, 195, 0.15)', 'rgba(139, 157, 195, 0.05)']}
                style={styles.tipCard}
              >
                <View style={styles.tipHeader}>
                  {tip.icon}
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                </View>
                <Text style={styles.tipText}>{tip.tip}</Text>
              </LinearGradient>
            ))}
          </View>

          {/* Closing */}
          <LinearGradient
            colors={['rgba(212, 175, 55, 0.2)', 'rgba(139, 157, 195, 0.1)']}
            style={styles.wisdomCard}
          >
            <View style={styles.wisdomHeader}>
              {Platform.OS === 'web' ? <EyeIcon size={24} /> : <Text style={{fontSize:20}}>👁️</Text>}
              <Text style={styles.wisdomTitle}>Mish’s Final Wisdom</Text>
            </View>
            <Text style={styles.wisdomText}>
              Magic is intention plus attention. Your tools are optional, your focus is everything.
            </Text>
            <Text style={styles.wisdomSignature}>Mystic Mish ✨</Text>
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  headerCenter: { alignItems: 'center', paddingTop: 20, paddingBottom: 24 },
  title: { fontSize: 36, fontFamily: 'PlayfairDisplay-Bold', color: '#e8e8e8', textAlign: 'center', letterSpacing: 2 },
  subtitle: { fontSize: 18, fontFamily: 'Inter-Regular', color: '#8b9dc3', textAlign: 'center', marginTop: 4 },
  welcomeCard: { borderRadius: 16, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', flexDirection: 'row', alignItems: 'center' },
  mishAvatarContainer: { position: 'relative', width: 80, height: 95, marginRight: 20, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: '#d4af37' },
  mishAvatar: { width: '100%', height: '100%', borderRadius: 18 },
  mishAvatarFallback: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  mishEmojiLarge: { fontSize: 60, marginBottom: 8 },
  mishNameLarge: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFD700', textAlign: 'center' },
  welcomeContent: { flex: 1 },
  welcomeTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay-Bold', color: '#d4af37', marginBottom: 8 },
  welcomeText: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#e8e8e8', lineHeight: 20 },
  moonMessageCard: { borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 2, borderColor: '#FFD700' },
  moonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  moonTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', color: '#d4af37' },
  moonPhaseText: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#FFD700', textAlign: 'center', marginBottom: 12 },
  moonMessage: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#FFD700', textAlign: 'center', marginBottom: 8 },
  moonDescription: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#ffffff', textAlign: 'center', lineHeight: 20 },
  spellsSection: { marginBottom: 32 },
  sectionTitle: { fontSize: 28, fontFamily: 'PlayfairDisplay-Bold', color: '#e8e8e8', textAlign: 'center', marginBottom: 20 },
  spellCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  spellHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  spellTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay-Bold', color: '#e8e8e8' },
  fullSpellContainer: { backgroundColor: 'rgba(26, 26, 46, 0.4)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.2)' },
  fullSpellText: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#e8e8e8', lineHeight: 20, fontStyle: 'italic', whiteSpace: 'pre-wrap' },
  tipsSection: { marginBottom: 32 },
  tipCard: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(139, 157, 195, 0.3)' },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  tipTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#e8e8e8' },
  tipText: { fontSize: 16, fontFamily: 'Inter-Regular', color: '#e8e8e8', lineHeight: 20 },
  wisdomCard: { borderRadius: 16, padding: 24, borderWidth: 2, borderColor: 'rgba(212, 175, 55, 0.4)' },
  wisdomHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 8 },
  wisdomTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay-Bold', color: '#d4af37' },
  wisdomText: { fontSize: 18, fontFamily: 'Inter-Regular', color: '#e8e8e8', lineHeight: 24, textAlign: 'center', fontStyle: 'italic', marginBottom: 12 },
  wisdomSignature: { fontSize: 16, fontFamily: 'PlayfairDisplay-Bold', color: '#d4af37', textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, fontFamily: 'Inter-Regular', color: '#8b9dc3', marginTop: 12 },
  paywallCard: { borderRadius: 16, padding: 24, marginTop: 40, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', alignItems: 'center' },
  paywallHeader: { alignItems: 'center', marginBottom: 24 },
  paywallTitle: { fontSize: 32, fontFamily: 'PlayfairDisplay-Bold', color: '#d4af37', marginTop: 12, textAlign: 'center' },
  mishPreviewContainer: { alignItems: 'center', marginBottom: 24, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: '#d4af37', width: 100, height: 120 },
  mishPreviewImage: { width: '100%', height: '100%' },
  mishPreviewFallback: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  featureItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  featureText: { fontSize: 18, fontFamily: 'Vazirmatn-Medium', color: '#e8e8e8', marginLeft: 12 },
  upgradeButton: { minWidth: 200 },
  headerIcon: { fontSize: 48, marginBottom: 6, color: '#d4af37' },
  headerTitle: { fontSize: 26, color: '#e8e8e8', fontFamily: 'Vazirmatn-Bold', textAlign: 'center' },
  headerSubtitle: { marginTop: 4, color: '#8b9dc3', fontSize: 16, fontFamily: 'Vazirmatn-Regular', textAlign: 'center' }
});
