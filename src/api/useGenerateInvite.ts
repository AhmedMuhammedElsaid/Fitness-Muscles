import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';

/**
 * Coach-only RPC that mints a fresh 6-char invite code. RLS restricts execution to
 * coaches; a non-coach caller gets a thrown error.
 */
export function useGenerateInvite() {
  return useMutation<string, Error>({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('generate_invite_code');
      if (error) throw error;
      return data as string;
    },
  });
}
