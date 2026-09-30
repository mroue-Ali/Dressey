import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';

import type { Dress } from '../data/types';
import { radius } from '../theme';

/** Dress photo, or a tinted placeholder when there is none. */
export function DressThumb({ dress, size, style }: { dress: Pick<Dress, 'photoUri' | 'color'>; size?: number; style?: ViewStyle }) {
  const box: ViewStyle = size ? { width: size, height: size, borderRadius: size / 3.5 } : { borderRadius: radius.md };
  return (
    <View style={[styles.box, box, { backgroundColor: dress.color }, style]}>
      {dress.photoUri ? (
        <Image source={{ uri: dress.photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <Ionicons name="shirt-outline" size={size ? size * 0.45 : 36} color="rgba(255,255,255,0.8)" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
});
