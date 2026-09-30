import type { Dress } from '@mobile/src/data/types';
import type { CSSProperties } from 'react';
import { IoShirtOutline } from 'react-icons/io5';

import { cx } from './ui';

/** Dress photo, or a tinted placeholder when there is none. Sized by `size` or by CSS. */
export function DressThumb({
  dress,
  size,
  className,
  dim,
}: {
  dress: Pick<Dress, 'photoUri' | 'color'> & { name?: string };
  size?: number;
  className?: string;
  dim?: boolean;
}) {
  const style: CSSProperties = { backgroundColor: dress.color };
  if (size) Object.assign(style, { width: size, height: size, borderRadius: size / 3.5 });
  return (
    <div className={cx('thumb', dim && 'thumb--dim', className)} style={style}>
      {dress.photoUri ? (
        <img src={dress.photoUri} alt={dress.name ?? ''} loading="lazy" />
      ) : (
        <IoShirtOutline size={size ? size * 0.45 : 36} aria-hidden />
      )}
    </div>
  );
}
