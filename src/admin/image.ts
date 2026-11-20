import { supabase } from '../lib/supabase';

const MAX_SIDE = 1400;

/** Reduce a 1400 px y convierte a WebP en el navegador: ahorra el 1 GB gratis de Storage y acelera la carga. */
export async function toWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/webp', 0.82),
  );
}

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Sube la imagen del producto a Supabase Storage convertida a WebP optimizado.
 * Devuelve la URL pública para persistir en la base de datos.
 */
export async function uploadProductImage(file: File, slug = 'producto'): Promise<string> {
  if (!supabase) throw new Error('Configura Supabase antes de subir imágenes.');
  if (!file.type.startsWith('image/')) throw new Error('El archivo seleccionado no es una imagen.');

  const blob = await toWebp(file);
  const safeSlug = slugify(slug) || 'plato';
  const fileName = `${safeSlug}-${crypto.randomUUID().slice(0, 8)}.webp`;
  const path = `${safeSlug}/${fileName}`;

  // Intentamos primero con el bucket 'products' (igual que en lm-perfumes)
  let bucket = 'products';
  let { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: true,
  });

  // Si 'products' no existe o falla, intentamos fallback con 'dish-images'
  if (error) {
    const fallback = await supabase.storage.from('dish-images').upload(path, blob, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true,
    });
    if (fallback.error) {
      throw new Error(error.message || fallback.error.message);
    }
    bucket = 'dish-images';
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteProductImage(pathOrUrl: string) {
  if (!supabase || !pathOrUrl) return;
  if (!pathOrUrl.includes('/storage/v1/object/public/')) return;
  try {
    const parts = pathOrUrl.split('/storage/v1/object/public/');
    if (parts.length < 2) return;
    const [bucket, ...rest] = parts[1].split('/');
    await supabase.storage.from(bucket).remove([rest.join('/')]);
  } catch {
    // No interrumpir si falla el borrado en storage
  }
}
