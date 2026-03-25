import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

function parseEnv(content) {
  const config = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.substring(1, value.length - 1);
      config[match[1]] = value;
    }
  });
  return config;
}

const envConfig = parseEnv(readFileSync('./.env.local', 'utf8'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function findUsers() {
  // Try to get transactions to see user_id
  const { data, error } = await supabase.from('transactions').select('user_id').limit(1);
  if (error) {
    console.error("Error fetching transactions:", error);
    return;
  }
  if (data && data.length > 0) {
    console.log("Found user_id from transactions:", data[0].user_id);
  } else {
    console.log("No transactions found.");
  }
}

findUsers();
