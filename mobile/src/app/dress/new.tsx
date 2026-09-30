import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DressThumb } from '../../components/DressThumb';
import { AmountInput, ChoiceChips, Field, FormError, FormScreen, Input, SubmitButton, useSave } from '../../components/form';
import { EmptyState, PrimaryButton } from '../../components/ui';
import { dressOrigins } from '../../data/labels';
import { useStore, type PhotoInput } from '../../data/store';
import type { DressOrigin } from '../../data/types';
import { confirm } from '../../lib/confirm';
import { parseAmount } from '../../lib/format';
import { colors, fonts, spacing } from '../../theme';

// Placeholder tints for dresses without a photo.
const TINTS = ['#E9D8B8', '#EBC7C1', '#D8C3A5', '#C9B8D6', '#BFD3C1', '#E6CFA8'];

const amountText = (n: number | undefined) => (n ? String(n) : '');

/** Adds a dress, or edits it when opened with ?id=. */
export default function DressFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { dresses, addDress, updateDress, deleteDress } = useStore();
  const existing = id ? dresses.find((d) => d.id === id) : undefined;

  const [origin, setOrigin] = useState<DressOrigin>(existing?.origin ?? 'bought');
  const [name, setName] = useState(existing?.name ?? '');
  const [shop, setShop] = useState(existing?.shop ?? '');
  const [price, setPrice] = useState(existing?.origin === 'bought' ? String(existing.purchasePrice) : '');
  const [rentalPrice, setRentalPrice] = useState(amountText(existing?.rentalPrice));
  const [size, setSize] = useState(existing?.size ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [photoUri, setPhotoUri] = useState<string | undefined>(existing?.photoUri);
  const [photo, setPhoto] = useState<PhotoInput>();
  const { saving, error, run } = useSave();
  const [tint] = useState(() => existing?.color ?? TINTS[Math.floor(Math.random() * TINTS.length)]);

  if (id && !existing) return <EmptyState text="This dress no longer exists" />;

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
      const input = {
        name: name.trim(),
        origin,
        shop: bought ? shop.trim() || undefined : undefined,
        purchasePrice: bought && purchase > 0 ? purchase : 0,
        rentalPrice: rental > 0 ? rental : 0,
        size: size.trim() || undefined,
        note: note.trim() || undefined,
        color: tint,
      };
      if (existing) {
        await updateDress(existing.id, input, photo);
        router.back();
      } else {
        const dress = await addDress(input, photo);
        router.replace({ pathname: '/dress/[id]', params: { id: dress.id } });
      }
    });

  const remove = () =>
    confirm(`Delete "${existing!.name}"? Its photo is deleted too. This cannot be undone.`, () =>
      run(async () => {
        await deleteDress(existing!.id);
        router.dismissAll();
        router.navigate('/dresses');
      }), 'Delete');

  return (
    <FormScreen footer={<SubmitButton label={saving ? 'Saving…' : existing ? 'Save changes' : bought ? 'Save purchase' : 'Save dress'} onPress={save} disabled={!valid || saving} />}>
      {existing ? <Stack.Screen options={{ title: 'Edit dress' }} /> : null}
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
      {existing ? <PrimaryButton label="Delete dress" icon="trash-outline" variant="danger" onPress={remove} /> : null}
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
