import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Simple parser for .env files
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

let envConfig = {};
try {
  envConfig = parseEnv(readFileSync('./.env.local', 'utf8'));
} catch (e) {
  try {
    envConfig = parseEnv(readFileSync('./.env', 'utf8'));
  } catch (e2) {
    console.error("Could not find .env or .env.local");
    process.exit(1);
  }
}

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function clearTransactions() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@gmail.com',
    password: 'test123'
  });
  
  if (authError) {
    console.log("Auth failed:", authError.message);
    return;
  }
  
  const userId = authData.session.user.id;
  console.log("Authenticated as:", userId);
  
  const { data: txs, error: fetchError } = await supabase
    .from('transactions')
    .select('id')
    .eq('user_id', userId);

  if (fetchError) {
    console.error("Error fetching transactions:", fetchError);
    return;
  }

  const txIds = txs.map(t => t.id);
  console.log(`Found ${txIds.length} transactions to clear.`);

  if (txIds.length > 0) {
    const { error: tagError } = await supabase
      .from('transaction_tags')
      .delete()
      .in('transaction_id', txIds);

    if (tagError) console.error("Error clearing transaction_tags:", tagError);
    else console.log("Cleared transaction_tags.");

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId);

    if (deleteError) console.error("Error clearing transactions:", deleteError);
    else console.log("Successfully cleared all transactions for this user.");
  } else {
    console.log("No transactions found to clear.");
  }
}

clearTransactions();
