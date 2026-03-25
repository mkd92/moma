import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

function parseEnv(content) {
  const config = {};
  content.split('\n').filter(Boolean).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"')) value = value.slice(1, -1);
      config[match[1]] = value;
    }
  });
  return config;
}
const env = parseEnv(readFileSync('./.env.local', 'utf8'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: user } = await supabase.auth.signInWithPassword({ email: 'manikandan.m1116@gmail.com', password: 'password123' }); // I don't know the password... actually I can just run it in the browser!
}
