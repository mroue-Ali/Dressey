import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DressThumb } from '../../components/DressThumb';
import { AmountInput, ChoiceChips, Field, FormError, FormScreen, Input, SubmitButton, useSave } from '../../components/form';
import { dressOrigins } from '../../data/labels';
import { useStore, type PhotoInput } from '../../data/store';
import type { DressOrigin } from '../../data/types';
import { parseAmount } from '../../lib/format';
import { colors, fonts, spacing } from '../../theme';

// Placeholder tints for dresses without a photo.
const TINTS = ['#E9D8B8', '#EBC7C1', '#D8C3A5', '#C9B8D6', '#BFD3C1', '#E6CFA8'];

export default function NewDressScreen() {
  const { addDress } = useStore();
  const [origin, setOrigin] = useState<DressOrigin>('bought');
  const [name, setName] = useState('');
  const [shop, setShop] = useState('');
  const [price, setPrice] = useState('');
  const [rentalPrice, setRentalPrice] = useState('');
  const [size, setSize] = useState('');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string>();
  const [photo, setPhoto] = useState<PhotoInput>();
  const { saving, error, run } = useSave();
  const [tint] = useState(() => TINTS[Math.floor(Math.random() * TINTS.length)]);

  const bought = origin === 'bought';
  const purchase = parseAmount(price);
  const rental = parseAmount(rentalPrice);
  const valid = name.trim() !== '' && (!bought || purchase >= 0) && (rentalPrice === '' || rental >= 0);

  const pickPhoto = async (fromCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.6, base64: true };
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
    }
    const result = fromCamera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    const asset = result.assets[0];
    // On web the picker returns a data: URL; take the base64 part from it if needed.
    const base64 = asset.base64 ?? asset.uri.split('base64,')[1];
    setPhotoUri(asset.uri);
    setPhoto(base64 ? { base64, mimeType: asset.mimeType ?? 'image/jpeg' } : undefined);
  };

  const save = () =>
    run(async () => {
      const dress = await addDress(
        {
          name: name.trim(),
          origin,
          shop: bought ? shop.trim() || undefined : undefined,
          purchasePrice: bought && purchase > 0 ? purchase : 0,
          rentalPrice: rental > 0 ? rental : 0,
          size: size.trim() || undefined,
          note: note.trim() || undefined,
          color: tint,
        },
        photo,
      );
      router.replace({ pathname: '/dress/[id]', params: { id: dress.id } });
    });

  return (
    <FormScreen footer={<SubmitButton label={saving ? 'Saving…' : bought ? 'Save purchase' : 'Save dress'} onPress={save} disabled={!valid || saving} />}>
      <View style={styles.photoRow}>
        <DressThumb dress={{ photoUri, color: tint }} style={styles.photo} />
        <View style={styles.photoActions}>
          <Pressable style={styles.photoBtn} onPress={() => pickPhoto(true)}>
            <Ionicons name="camera-outline" size={20} color={colors.primaryDark} />
            <Text style={styles.photoBtnText}>Take photo</Text>
          </Pressable>
          <Pressable style={styles.photoBtn} onPress={() => pickPhoto(false)}>
            <Ionicons name="images-outline" size={20} color={colors.primaryDark} />
            <Text style={styles.photoBtnText}>From gallery</Text>
          </Pressable>
        </View>
      </View>

      <Field label="Where is it from">
        <ChoiceChips options={dressOrigins} value={origin} onChange={setOrigin} />
      </Field>
      <Field label="Dress name">
        <Input value={name} onChangeText={setName} placeholder="e.g. Champagne satin gown" />
      </Field>

      {bought ? (
        <>
          <Field label="Shop">
            <Input value={shop} onChangeText={setShop} placeholder="Where you bought it" />
          </Field>
          <Field label="Price paid" hint="Counts as money out of the business">
            <AmountInput value={price} onChangeText={setPrice} />
          </Field>
        </>
      ) : null}

      <Field label="Rental price" hint="Your usual price per rental (optional)">
        <AmountInput value={rentalPrice} onChangeText={setRentalPrice} />
      </Field>
      <Field label="Size">
        <Input value={size} onChangeText={setSize} placeholder="e.g. M, 38" />
      </Field>
      <Field label="Note">
        <Input value={note} onChangeText={setNote} placeholder={origin === 'gift' ? 'Gift from…' : 'Optional'} multiline />
      </Field>
      <FormError message={error} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  photoRow: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  photo: { width: 120, height: 160 },
  photoActions: { flex: 1, gap: spacing.sm },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
  },
  photoBtnText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primaryDark },
});
