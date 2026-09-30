import { dressOrigins } from '@mobile/src/data/labels';
import type { DressOrigin } from '@mobile/src/data/types';
import { parseAmount } from '@mobile/src/lib/format';
import { useEffect, useRef, useState } from 'react';
import { IoCameraOutline, IoImagesOutline, IoTrashOutline } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router';

import { DressThumb } from '../components/DressThumb';
import { AmountInput, ChoiceChips, Field, FormError, FormPage, Input, SubmitButton, TextArea, useSave } from '../components/form';
import { Button, EmptyState, SubPage } from '../components/ui';
import { useStore } from '../data/store';
import { useGoBack } from '../lib/nav';
import { preparePhoto } from '../lib/photo';

// Placeholder tints for dresses without a photo (same as the mobile app).
const TINTS = ['#E9D8B8', '#EBC7C1', '#D8C3A5', '#C9B8D6', '#BFD3C1', '#E6CFA8'];

// Phones and tablets can open the camera straight from a file input.
const canUseCamera = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

const amountText = (n: number | undefined) => (n ? String(n) : '');

/** Adds a dress at /dress/new, or edits one at /dress/:id/edit. */
export function DressFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack(id ? `/dress/${id}` : '/dresses');
  const { dresses, addDress, updateDress, deleteDress } = useStore();
  const existing = id ? dresses.find((d) => d.id === id) : undefined;

  const [origin, setOrigin] = useState<DressOrigin>(existing?.origin ?? 'bought');
  const [name, setName] = useState(existing?.name ?? '');
  const [shop, setShop] = useState(existing?.shop ?? '');
  const [price, setPrice] = useState(existing?.origin === 'bought' ? String(existing.purchasePrice) : '');
  const [rentalPrice, setRentalPrice] = useState(amountText(existing?.rentalPrice));
  const [size, setSize] = useState(existing?.size ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [photo, setPhoto] = useState<Blob>();
  const [photoUri, setPhotoUri] = useState(existing?.photoUri);
  const { saving, error, run } = useSave();
  const [tint] = useState(() => existing?.color ?? TINTS[Math.floor(Math.random() * TINTS.length)]);

  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | undefined>(undefined);
  useEffect(() => () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);

  if (id && !existing) {
    return (
      <SubPage title="Edit dress" back="/dresses" narrow>
        <EmptyState text="This dress no longer exists" />
      </SubPage>
    );
  }

  const bought = origin === 'bought';
  const purchase = parseAmount(price);
  const rental = parseAmount(rentalPrice);
  const valid = name.trim() !== '' && (!bought || purchase >= 0) && (rentalPrice === '' || rental >= 0);

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    const blob = await preparePhoto(file);
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = URL.createObjectURL(blob);
    setPhotoUri(previewUrl.current);
    setPhoto(blob);
  };

  const save = () => {
    if (!valid || saving) return;
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
        goBack();
      } else {
        const dress = await addDress(input, photo);
        navigate(`/dress/${dress.id}`, { replace: true });
      }
    });
  };

  const remove = () => {
    if (!existing || !window.confirm(`Delete "${existing.name}"? Its photo is deleted too. This cannot be undone.`)) return;
    run(async () => {
      await deleteDress(existing.id);
      navigate('/dresses', { replace: true });
    });
  };

  return (
    <FormPage
      title={existing ? 'Edit dress' : 'Add dress'}
      back={existing ? `/dress/${existing.id}` : '/dresses'}
      onSubmit={save}
      footer={
        <SubmitButton label={saving ? 'Saving…' : existing ? 'Save changes' : bought ? 'Save purchase' : 'Save dress'} disabled={!valid || saving} />
      }
    >
      <div className="photo-row">
        <DressThumb dress={{ photoUri, color: tint }} className="photo-preview" />
        <div className="stack-sm photo-actions">
          {canUseCamera ? (
            <button type="button" className="photo-btn" onClick={() => cameraInput.current?.click()}>
              <IoCameraOutline size={20} />
              Take photo
            </button>
          ) : null}
          <button type="button" className="photo-btn" onClick={() => galleryInput.current?.click()}>
            <IoImagesOutline size={20} />
            {canUseCamera ? 'From gallery' : photoUri ? 'Change photo' : 'Choose photo'}
          </button>
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
          <input ref={galleryInput} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
        </div>
      </div>

      <Field label="Where is it from">
        <ChoiceChips options={dressOrigins} value={origin} onChange={setOrigin} />
      </Field>
      <Field label="Dress name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Champagne satin gown" autoComplete="off" />
      </Field>

      {bought ? (
        <>
          <Field label="Shop">
            <Input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="Where you bought it" autoComplete="off" />
          </Field>
          <Field label="Price paid" hint="Counts as money out of the business">
            <AmountInput value={price} onChange={setPrice} />
          </Field>
        </>
      ) : null}

      <Field label="Rental price" hint="Your usual price per rental (optional)">
        <AmountInput value={rentalPrice} onChange={setRentalPrice} />
      </Field>
      <Field label="Size">
        <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. M, 38" autoComplete="off" />
      </Field>
      <Field label="Note">
        <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder={origin === 'gift' ? 'Gift from…' : 'Optional'} />
      </Field>
      <FormError message={error} />
      {existing ? <Button label="Delete dress" icon={IoTrashOutline} variant="danger" disabled={saving} onClick={remove} /> : null}
    </FormPage>
  );
}
