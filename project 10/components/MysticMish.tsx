// components/MysticMish.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentMoonPhase, getCurrentPlanetaryPositionsEnhanced } from '@/utils/astronomy';

// Fallback for web environment
if (typeof Platform === 'undefined') {
  (global as any).Platform = { OS: 'web' };
}

// ✅ Pre-import the avatar image for better type safety
const mishAvatar = require('../assets/images/mystic-mish/headshot.png');

const { width: screenWidth } = Dimensions.get('window');

interface MysticMishProps {
  onRitualReveal?: (ritual: string) => void; // receives the full ritual for the Mystic Mish tab
  hemisphere: 'Northern' | 'Southern';
}

// 🔮 Ritual data (no em dashes)
const RITUALS = {
  newMoon: [
    "🌑 **New Moon Manifestation**: Write your intentions on paper, fold it three times, and place it under your pillow.",
    "🕯️ **Fresh Start Ritual**: Light a black candle to banish old energy, then a white one for new beginnings.",
    "✨ **Seed Planting**: Write down three goals and bury the paper in a small pot with a seed or plant.",
    "🌑 **Spell of the Silver Seed**: The new moon is coming on the 23rd - a ritual for planting new beginnings under the dark sky of the New Moon - see full spell.",
    "🦁 **Fire Mirror Ritual** (Leo New Moon): Light a gold candle in front of a mirror. Gaze at your reflection and whisper: 'I see the fire. I call it higher.' Write self-praise on a bay leaf and burn it safely. *Mish's Tip: Confidence is a spell. Cast it daily with your posture and voice.*",
    "♍ **Herbal Pouch Spell** (Virgo New Moon): Create a pouch with lavender, rosemary, and quartz for cleansing routines. *Mish's Tip: Your daily rituals are spells. Make them sacred.*"
  ],
  waxingCrescent: [
    "🌒 **Crescent Growth**: Place a silver coin in water overnight, then use the water to nurture a plant.",
    "📝 **Intention Amplification**: Write your goals with green ink and place the paper where moonlight can touch it.",
    "🔮 **Forward Motion**: Walk clockwise in a circle while visualising your dreams growing stronger.",
    "💬 **Voice Reclamation Ritual** (Mercury Direct): Draw a sigil over your journal page with lemon balm ink to reclaim your authentic voice. *Mish's Tip: Your words are spells. Choose them like magic.*"
  ],
  firstQuarter: [
    "🌓 **Decision Ritual**: Place two candles representing choices, light the one that feels right.",
    "⚖️ **Balance Working**: Hold a small stone in each hand, feel their weight, then choose which to keep.",
    "🌱 **Growth Acceleration**: Water a plant while speaking your intentions aloud."
  ],
  waxingGibbous: [
    "🌔 **Refinement Spell**: Edit a list of goals, making them more specific and aligned.",
    "✂️ **Cutting Away**: Use scissors to cut paper representing obstacles in your path.",
    "📈 **Energy Building**: Charge a crystal in sunlight, then carry it close to your heart.",
    "🪐 **Portal of Prosperity** (Lionsgate 8/8): Arrange 8 coins in an infinity shape with citrine at centre. Sip sun charged water and journal: 'I open the gate. I walk with fate.' *Mish's Tip: Think bigger. Manifest worth, not just wealth.*",
    "💖 **Rose Water Love Bath** (Venus Jupiter): Add rose petals to your bath for soul nourishing love and abundance. *Mish's Tip: Love yourself first. The universe is watching.*"
  ],
  fullMoon: [
    "🌕 **Full Moon Release**: Write what you want to release on paper and safely burn it under moonlight.",
    "💧 **Moon Water Blessing**: Place a bowl of water under the full moon to charge it with lunar energy.",
    "✨ **Illumination Ritual**: Meditate with a white candle and ask for clarity on your path.",
    "🌕 **Electric Thread Ritual** (Aquarius Full Moon): Tie silver thread around your wrist, hold the other end to the moon, and say: 'I am connected, expanded, awake.' Write three visionary ideas with actions. *Mish's Tip: The world needs your weird. Honour your unique code.*"
  ],
  waningGibbous: [
    "🌖 **Gratitude Flow**: List all that you are thankful for and speak each item aloud.",
    "🧹 **Gentle Clearing**: Sweep your home with intention, visualising the removal of stagnant energy.",
    "🍵 **Healing Tea**: Brew a cup of tea with healing intention, sipping slowly and mindfully.",
    "💫 **Glamour Spell** (Venus in Leo): Use rose petals and gold shimmer to amplify your magnetism. *Mish's Tip: You are the magic. Dress like it.*"
  ],
  lastQuarter: [
    "🌗 **Release Ritual**: Write down what no longer serves you and tear the paper into pieces.",
    "🧿 **Protection Working**: Place a blue object near your door to ward off negative energy.",
    "🔄 **Cycle Completion**: Draw a circle and divide it in four, marking what phase of life you are in."
  ],
  waningCrescent: [
    "🌘 **Final Release**: Wash your hands in salt water to cleanse away the last of what you are releasing.",
    "🌿 **Rest and Recover**: Create a small altar with restful items like lavender or chamomile.",
    "📉 **Surrender Practice**: Write 'I release control of...' and complete the sentence five times.",
    "🪐 **Money Altar Refresh** (Jupiter Retrograde): Refresh your abundance altar with cinnamon, coins, and gratitude. *Mish's Tip: Abundance flows to grateful hearts.*"
  ],

  // 🔮 Cosmic event spells for November (no em dashes)
  cosmicNovember: {
    microNewMoonScorpio: {
      Southern:
        "🌑 **Southern Hemisphere - The Blooming Serpent Spell**\nA ritual for shedding old skins and birthing authentic power as spring matures.\n\nSeasonal Context: Spring is abundant. The Micro New Moon in Scorpio asks for inner renewal before summer expansion.\nMoon Phase: Micro New Moon\nElements: Water and Fire\n\n1) Prepare the Stillness\nLight a candle and gaze into a dark bowl of water.\nSay: 'From light to shadow and back again, I shed what no longer lives within.'\n\n2) Salt Purification\nSprinkle a pinch of salt into the water.\nSay: 'In purity I return to truth, in silence I reclaim my youth.'\n\n3) Serpent Invocation\nHold a fresh flower or leaf and picture the ancient serpent beneath you.\nSay: 'I am the one who blooms and sheds. Through release I reclaim my soul.'\n\n4) Offer Back\nDip the flower in the water and return it to the earth.\nWhisper: 'I give what no longer serves, that I may live in my full curve.'\n\n5) Close\nExtinguish the candle. In the morning pour the water at the base of a tree.",
      Northern:
        "🌑 **Northern Hemisphere - The Serpent's Shadow Spell**\nA ritual for surrender, truth, and regeneration as autumn deepens.\n\nSeasonal Context: The land enters quiet. The Micro New Moon in Scorpio invites honest release before winter.\nMoon Phase: Micro New Moon\nElements: Water and Earth\n\n1) Cast the Quiet\nLight a black candle and reflect its flame in a dark bowl of water.\nSay: 'As the wheel turns towards the night, I shed what dims my sacred light.'\n\n2) Salt of Truth\nDrop salt into the water and stir slowly.\nSay: 'Through water's calm I see my core. I am reborn through what I restore.'\n\n3) Call Renewal\nHold dried leaves or herbs and feel their texture.\nSay: 'I am the one who changes form. Through shadow's gift I come to see.'\n\n4) Lay to Rest\nBurn or bury the leaves with gratitude.\nWhisper: 'With grace I end, with peace I rest. What fades now leaves me blessed.'\n\n5) Close\nExtinguish the candle with wet fingers. Pour the water to bare earth the next day."
    }
  }
};

const BUILD_TAG = 'MysticMish v2025-11-01b';

export default function MysticMish({ onRitualReveal, hemisphere }: MysticMishProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentRitual, setCurrentRitual] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRitual, setShowRitual] = useState(false);
  const [moonPhase, setMoonPhase] = useState(getCurrentMoonPhase());
  const [planetaryPositions, setPlanetaryPositions] = useState<any[]>([]);
  const [hasAccess, setHasAccess] = useState(true); // soft gate
  const [imageError, setImageError] = useState(false);

  const isMounted = useRef(true);

  // Persist Animated values across renders
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const wiggleAnimation = useRef(new Animated.Value(0)).current;

  // Pick the full November spell for the MYSTIC MISH TAB, not the popup
  const getNovemberSpellForTab = (): string | null => {
    const now = new Date();
    const isNovember = now.getMonth() === 10; // 0 based
    const isNov20 = now.getDate() === 20;

    if (isNovember && isNov20) {
      const key = hemisphere === 'Southern' ? 'Southern' : 'Northern';
      const spell = RITUALS.cosmicNovember?.microNewMoonScorpio?.[key];
      return spell || null;
    }
    return null;
  };

  // Teaser text for the little popup only
  const getTeaserText = (): string => {
    // Short, month aware, and not Halloween
    const now = new Date();
    const isNovember = now.getMonth() === 10;
    if (isNovember) {
      return 'November gateway active. Tap Mish to open today’s rite in the Mystic Mish tab.';
    }
    return 'Tap Mish for today’s rite in the Mystic Mish tab.';
  };

  const checkRitualTime = async () => {
    const currentMoon = getCurrentMoonPhase();
    setMoonPhase(currentMoon);

    try {
      const positions =
        typeof getCurrentPlanetaryPositionsEnhanced === 'function'
          ? await getCurrentPlanetaryPositionsEnhanced(hemisphere as any)
          : [];
      setPlanetaryPositions(Array.isArray(positions) ? positions : []);
    } catch {
      setPlanetaryPositions([]);
    }

    // Always keep the popup as a teaser only
    const teaser = getTeaserText();

    // Send the full November spell to the tab if applicable
    const tabSpell = getNovemberSpellForTab();
    if (tabSpell && onRitualReveal) {
      try {
        onRitualReveal(tabSpell);
        console.log('[MysticMish] build=', BUILD_TAG, 'sent tab spell for', hemisphere);
      } catch (e) {
        console.warn('[MysticMish] onRitualReveal error', e);
      }
    } else {
      console.log('[MysticMish] build=', BUILD_TAG, 'no special tab spell today');
    }

    if (isMounted.current) {
      setCurrentRitual(teaser);
      setIsVisible(true);
      startAnimations();
    }
  };

  const startAnimations = () => {
    if (Platform.OS === 'ios') return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(floatAnimation, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(sparkleAnimation, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(wiggleAnimation, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(wiggleAnimation, { toValue: -1, duration: 4000, useNativeDriver: true }),
        Animated.timing(wiggleAnimation, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleMishTap = () => {
    if (isAnimating) return;
    if (isMounted.current) setIsAnimating(true);

    Animated.sequence([
      Animated.timing(scaleAnimation, { toValue: 1.15, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnimation, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      if (isMounted.current) {
        setIsAnimating(false);
        setShowRitual(true);
        onRitualReveal?.(getNovemberSpellForTab() || 'Open the Mystic Mish tab for today’s rite.');
      }
    });
  };

  useEffect(() => {
    isMounted.current = true;

    const checkAccess = async () => {
      try {
        const { getSubscriptionStatus } = await import('@/utils/billing');
        const subscriptionStatus = await getSubscriptionStatus();
        console.log('🔍 [MysticMish] Subscription check:', subscriptionStatus);
        if (isMounted.current) {
          const allowed = subscriptionStatus?.active !== false;
          setHasAccess(allowed);
        }
      } catch (error) {
        console.error('❌ [MysticMish] Access check error:', error);
        if (isMounted.current) setHasAccess(true); // fail open
      }
    };

    checkAccess();

    const isOldDevice = Platform.OS === 'ios' && (Number(Platform.Version) || 0) < 13;
    const delay = isOldDevice ? 3000 : 2000;

    const timer = setTimeout(async () => {
      if (isMounted.current) {
        await checkRitualTime();
      }
    }, delay);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hemisphere]);

  // Auto-hide ritual popup after a while
  useEffect(() => {
    if (!showRitual) return;
    const timer = setTimeout(() => {
      if (isMounted.current) setShowRitual(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [showRitual]);

  if (!isVisible) return null;

  const floatTransform = floatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const sparkleOpacity = sparkleAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const sparkleRotate = sparkleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const wiggleRotate = wiggleAnimation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-1.5deg', '0deg', '1.5deg'],
  });

  const getTransforms = () => {
    if (Platform.OS === 'ios') {
      return [{ scale: scaleAnimation }];
    }
    return [{ translateY: floatTransform }, { scale: scaleAnimation }, { rotate: wiggleRotate }];
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Ritual popup - shows teaser only */}
      {showRitual && (
        <View style={styles.ritualPopup} pointerEvents="box-none">
          <LinearGradient
            colors={['rgba(139, 157, 195, 0.98)', 'rgba(75, 0, 130, 0.95)']}
            style={styles.ritualCard}
          >
            <Text style={styles.ritualTitle}>✨ Mystic Mish Says ✨</Text>
            <Text style={styles.moonPhaseText}>
              Current Moon: {moonPhase.phase} ({moonPhase.illumination}%)
            </Text>
            <Text style={styles.ritualText}>{currentRitual}  •  {BUILD_TAG}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowRitual(false)}>
              <Text style={styles.closeButtonText}>Thank you, Mish! 🌟</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Mystic Mish character */}
      <Animated.View style={[styles.mishContainer, { transform: getTransforms() }]}>
        <TouchableOpacity onPress={handleMishTap} style={styles.mishTouchable} activeOpacity={0.8}>
          {/* Sparkles */}
          {Platform.OS !== 'ios' && (
            <>
              <Animated.View
                style={[
                  styles.sparkle,
                  styles.sparkle1,
                  { opacity: sparkleOpacity, transform: [{ rotate: sparkleRotate }] },
                ]}
              >
                <Text style={styles.sparkleText}>✨</Text>
              </Animated.View>
              <Animated.View
                style={[
                  styles.sparkle,
                  styles.sparkle2,
                  { opacity: sparkleOpacity, transform: [{ rotate: sparkleRotate }] },
                ]}
              >
                <Text style={styles.sparkleText}>🌟</Text>
              </Animated.View>
              <Animated.View
                style={[
                  styles.sparkle,
                  styles.sparkle3,
                  { opacity: sparkleOpacity, transform: [{ rotate: sparkleRotate }] },
                ]}
              >
                <Text style={styles.sparkleText}>⭐</Text>
              </Animated.View>
              <Animated.View
                style={[
                  styles.sparkle,
                  styles.sparkle4,
                  { opacity: sparkleOpacity, transform: [{ rotate: sparkleRotate }] },
                ]}
              >
                <Text style={styles.sparkleText}>💫</Text>
              </Animated.View>
            </>
          )}

          {/* Avatar */}
          <View style={styles.imageContainer}>
            {!imageError ? (
              <Image
                source={mishAvatar}
                style={styles.mishImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.mishPlaceholder}>
                <Text style={styles.mishEmoji}>🔮</Text>
                <Text style={styles.mishName}>Mish</Text>
              </View>
            )}
            {Platform.OS !== 'ios' && <View style={styles.glowEffect} />}
          </View>

          {/* Little ! bubble */}
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>!</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    left: 15,
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  mishContainer: {
    position: 'relative',
  },
  mishTouchable: {
    position: 'relative',
    padding: 8,
    pointerEvents: 'auto',
  },
  imageContainer: {
    position: 'relative',
    width: 85,
    height: 100,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 0 12px rgba(255, 215, 0, 0.6)' },
      ios: {},
      default: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
    }),
  },
  mishImage: {
    width: 80,
    height: 95,
    borderRadius: 18,
  },
  mishPlaceholder: {
    width: 80,
    height: 95,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 157, 195, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  mishEmoji: { fontSize: 32, marginBottom: 4 },
  mishName: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    textAlign: 'center',
  },
  glowEffect: {
    position: 'absolute',
    inset: 0,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    ...Platform.select({
      web: { boxShadow: '0 0 15px rgba(255, 215, 0, 0.4)' },
      ios: {},
      default: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
      },
    }),
  },
  sparkle: { position: 'absolute', zIndex: 1 },
  sparkle1: { top: 2, left: 12 },
  sparkle2: { top: 18, right: 8 },
  sparkle3: { bottom: 15, left: 8 },
  sparkle4: { top: 35, right: 20 },
  sparkleText: {
    fontSize: 12,
    color: '#FFD700',
    ...Platform.select({
      web: { textShadow: '0 0 2px rgba(255, 255, 255, 1)' },
      ios: {},
      default: {
        textShadowColor: 'rgba(255, 255, 255, 1)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 2,
      },
    }),
  },
  speechBubble: {
    position: 'absolute',
    top: -2,
    right: 2,
    width: 20,
    height: 20,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    ...Platform.select({
      web: { boxShadow: '0 0 5px rgba(255, 215, 0, 0.8)' },
      ios: {},
      default: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
      },
    }),
  },
  speechText: { color: '#4B0082', fontSize: 12, fontFamily: 'Inter-Bold' },

  ritualPopup: {
    position: 'absolute',
    top: 0,
    left: 95,
    width: Math.min(screenWidth - 130, 280),
    zIndex: 1001,
  },
  ritualCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#FFD700',
    ...Platform.select({
      web: { boxShadow: '0 0 12px rgba(255, 215, 0, 0.6)' },
      ios: {},
      default: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
    }),
  },
  ritualTitle: {
    fontSize: 15,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
    ...Platform.select({
      web: { textShadow: '1px 1px 2px #4B0082' },
      ios: {},
      default: {
        textShadowColor: '#4B0082',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  moonPhaseText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.8,
  },
  ritualText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    lineHeight: 18,
    marginBottom: 14,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  closeButtonText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    textAlign: 'center',
  },
});
