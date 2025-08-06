import { supabase } from '../lib/supabase';

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('students').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('Supabase test failed:', error);
    return false;
  }
};

export const testSupabaseAuth = async () => {
  try {
    console.log('Testing Supabase Auth...');
    
    // Test auth session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase Auth error:', error);
      return false;
    }
    
    console.log('Supabase Auth test successful!', session ? 'User logged in' : 'No active session');
    return true;
  } catch (error) {
    console.error('Supabase Auth test failed:', error);
    return false;
  }
};
