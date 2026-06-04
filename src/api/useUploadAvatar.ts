import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';

interface UploadAvatarInput {
  userId: string;
  /** Local file URI from `expo-image-picker`. */
  uri: string;
}

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

/**
 * Uploads an avatar to the `avatars` bucket at `{userId}/avatar.{ext}` (path convention
 * the storage RLS enforces), then writes the public URL back onto `profiles.avatar_url`.
 * Returns the public URL.
 */
export function useUploadAvatar() {
  return useMutation<string, Error, UploadAvatarInput>({
    mutationFn: async ({ userId, uri }) => {
      const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase();
      const contentType = CONTENT_TYPES[ext] ?? 'image/jpeg';
      const path = `${userId}/avatar.${ext}`;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType, upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);
      if (updateError) throw updateError;

      return publicUrl;
    },
  });
}
