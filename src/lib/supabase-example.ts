import { supabase } from './supabase';

// Example functions demonstrating Supabase usage

// Example: Select data from a table
export async function getData() {
  const { data, error } = await supabase
    .from('your_table_name')
    .select('*');
  
  if (error) throw error;
  return data;
}

// Example: Insert data
export async function insertData<T>(table: string, data: T) {
  const { data: insertedData, error } = await supabase
    .from(table)
    .insert(data)
    .select();
  
  if (error) throw error;
  return insertedData;
}

// Example: Update data
export async function updateData<T>(table: string, id: string, data: Partial<T>) {
  const { data: updatedData, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return updatedData;
}

// Example: Delete data
export async function deleteData(table: string, id: string) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Example: Real-time subscription
export function subscribeToTable<T>(table: string, callback: (payload: T) => void) {
  const subscription = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: table
      },
      (payload) => callback(payload as T)
    )
    .subscribe();
  
  return subscription;
}

// Example: Upload file to Supabase Storage
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: {
    upsert?: boolean;
    contentType?: string;
  }
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, options);
  
  if (error) throw error;
  return data;
}

// Example: Get public URL for a file
export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

// Example: Auth - Sign up
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

// Example: Auth - Sign in
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

// Example: Auth - Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Example: Get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}