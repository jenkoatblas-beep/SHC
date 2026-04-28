import { supabase } from './src/store/supabaseClient.js';
import dotenv from 'dotenv';
dotenv.config();

async function fixHashes() {
  const badHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHuu';
  const goodHash = '$2a$10$sa9v74MBtbOI1aC7Tak2h.PzAQRCV5gM.rP3ONoZ7W.Z/D00buGTO';
  
  console.log('Fixing hashes in Supabase...');
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: goodHash })
    .eq('password_hash', badHash);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Hashes updated successfully.');
  }
}
fixHashes();
