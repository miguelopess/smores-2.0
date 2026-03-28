import { supabase } from './supabaseClient';

export async function uploadTaskPhoto(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('task-photos')
    .upload(fileName, file);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('task-photos')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}
