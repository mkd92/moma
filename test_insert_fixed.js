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

async function testInsert() {
  // Try to auth first
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@gmail.com',
    password: 'test123'
  });
  
  if (authError) {
    console.log("Auth failed:", authError.message);
    return;
  }
  
  console.log("Logged in user:", authData.session.user.id);
  
  // Get a category
  const { data: catData } = await supabase.from('categories').select('id').limit(1);
  const catId = catData.length > 0 ? catData[0].id : null;
  console.log("Category ID:", catId);
  
  const newTx = {
    amount: 55.55,
    type: 'expense',
    category_id: catId,
    user_id: authData.session.user.id
  };
  
  console.log("Inserting:", newTx);
  
  const { data: insertData, error: insertError } = await supabase.from('transactions').insert([newTx]);
  
  if (insertError) {
    console.log("Insert failed with error:", JSON.stringify(insertError, null, 2));
  } else {
    console.log("Insert Succeeded!");
  }
}

testInsert();
