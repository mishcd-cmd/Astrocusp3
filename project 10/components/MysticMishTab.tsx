// components/MysticMishTab.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Platform, StyleSheet } from 'react-native';

type Payload = { title: string; body: string; version?: string };

const HALLOWEEN_MARKERS = [
  'Halloween',
  'Samhain',
  'Veil Walker',
  'pumpkin',
  'thinning veil',
];

function stripHalloween(input: string): string {
  return input
    .split('\n')
    .filter((line) => !HALLOWEEN_MARKERS.some((m) => line.toLowerCase().includes(m.toLowerCase())))
    .join('\n')
    .trim();
}

export default function MysticMishTab() {
  const [payload, setPayload] = useState<Payload | null>(null);

  // Hydrate from storage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('mish.ritual');
        if (raw) {
          const p = JSON.parse(raw) as Payload;
          setPayload({
            ...p,
            body: stripHalloween(p.body || ''),
          });
        }
      }
    } catch {}

    // Listen for new broadcasts from the Daily emitter
    function onMish(e: Event) {
      const detail = (e as CustomEvent).detail as Payload;
      if (!detail) return;
      const clean: Payload = {
        ...detail,
        body: stripHalloween(detail.body || ''),
      };
      setPayload(clean);
      try {
        window.localStorage.setItem('mish.ritual', JSON.stringify(clean));
      } catch {}
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('mish:ritual', onMish as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mish:ritual', onMish as EventListener);
      }
    };
  }, []);

  const title = payload?.title || 'Mystic Mish';
  const body = payload?.body || 'Open the Daily page and tap Mish to load today’s rite.';

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.h1}>{title}</Text>
        {payload?.version ? <Text style={styles.version}>Build {payload.version}</Text> : null}
        <Text style={styles.body}>{body}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: Platform.select({
      web: 'rgba(75,0,130,0.08)',
      default: 'rgba(75,0,130,0.18)',
    }),
  },
  h1: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFD700',
    marginBottom: 6,
    textAlign: 'center',
  },
  version: {
    fontSize: 11,
    color: '#cfcfcf',
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#ffffff',
    fontFamily: 'Inter-Regular',
    whiteSpace: Platform.OS === 'web' ? 'pre-wrap' : undefined,
  } as any,
});
