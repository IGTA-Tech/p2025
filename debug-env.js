import dotenv from 'dotenv';

dotenv.config();

console.log('Environment Variables Check:\n');

console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET (' + process.env.VITE_SUPABASE_URL.substring(0, 30) + '...)' : 'NOT SET');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET (' + process.env.VITE_SUPABASE_ANON_KEY.substring(0, 30) + '...)' : 'NOT SET');

console.log('\nAll ENV variables starting with VITE_:');
Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .forEach(key => {
    const value = process.env[key];
    const display = value.length > 40 ? value.substring(0, 40) + '...' : value;
    console.log(`  ${key}: ${display}`);
  });
