import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// --- Configuration ---
const USER_EMAIL = process.env.IMPORT_EMAIL || 'test@gmail.com';
const USER_PASS  = process.env.IMPORT_PASS  || 'test123';

// --- Helper: Parse .env file ---
function parseEnv(content) {
  const config = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?(\s*)$/);
    if (match) {
      let value = match[2] || '';
      value = value.trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      config[match[1]] = value;
    }
  });
  return config;
}

const envConfig = parseEnv(readFileSync('./.env.local', 'utf8'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

// --- Helper: Full CSV Parser (handles quoted fields with commas) ---
function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCSV(content) {
  const rawLines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const headers = parseCSVLine(rawLines[0]);
  return rawLines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (values[i] || '').trim();
    });
    return obj;
  });
}

// --- Category name normalization map (CSV name -> canonical DB name) ---
// Keys are lowercased CSV names; values are the canonical names to use/create
const CATEGORY_ALIASES = {
  'interest & divident': 'Interest & Dividend',
  'interest & dividend': 'Interest & Dividend',
  'maintanance': 'Maintenance',
  'maintanance ': 'Maintenance',
  'transfer & return': 'Transfer & Return',
  'other expenses': 'Other Expenses',
  'other income': 'Other Income',
  'bill payment': 'Bill Payment',
  'office expense': 'Office Expense',
  'guest house rent': 'Guest House Rent',
  'shop rent': 'Shop Rent',
  'personal income': 'Personal Income',
  'maya income': 'Maya Income',
  'charges, fees': 'Charges & Fees',
  '"charges, fees"': 'Charges & Fees',
};

function normalizeCategoryName(raw) {
  if (!raw) return '';
  const lower = raw.toLowerCase().trim();
  return CATEGORY_ALIASES[lower] || raw.trim();
}

// --- ICONS for auto-created categories ---
const CATEGORY_ICONS = {
  'food': '🍽️',
  'groceries': '🛒',
  'fuel': '⛽',
  'health': '💊',
  'shopping': '🛍️',
  'subscription': '📺',
  'bill payment': '📄',
  'utilities': '💡',
  'entertainment': '🎬',
  'kids': '👶',
  'parking': '🅿️',
  'maintenance': '🔧',
  'office expense': '🏢',
  'guest house rent': '🏠',
  'shop rent': '🏪',
  'investment': '📈',
  'lending': '💸',
  'dad': '👨‍👦',
  'transfer & return': '🔄',
  'other expenses': '💰',
  'other income': '💰',
  'personal income': '💼',
  'interest & dividend': '💹',
  'maya income': '🌟',
  'charges & fees': '💳',
};

function iconForCategory(name) {
  return CATEGORY_ICONS[name.toLowerCase()] || '🔖';
}

async function main() {
  // 1. Sign in
  console.log(`🔐 Signing in as ${USER_EMAIL}...`);
  const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
    email: USER_EMAIL,
    password: USER_PASS,
  });
  if (authError || !session) {
    console.error('❌ Authentication failed:', authError?.message);
    process.exit(1);
  }
  const uid = session.user.id;
  console.log(`✅ Logged in as ${session.user.email} (${uid})`);

  // 2. Parse CSV
  const csvPath = process.argv[2] || './Expense Manager - தாள்11 (2).csv';
  console.log(`📂 Reading CSV: ${csvPath}`);
  const csvContent = readFileSync(csvPath, 'utf8');
  const rows = parseCSV(csvContent);
  console.log(`📊 Parsed ${rows.length} rows`);

  // 3. Load existing lookups
  async function getLookups() {
    const [accs, cats, prts, tgs] = await Promise.all([
      supabase.from('accounts').select('id, name').eq('user_id', uid),
      supabase.from('categories').select('id, name, type'),
      supabase.from('parties').select('id, name').eq('user_id', uid),
      supabase.from('tags').select('id, name').eq('user_id', uid),
    ]);
    return {
      accounts:   accs.data || [],
      categories: cats.data || [],
      parties:    prts.data || [],
      tags:       tgs.data || [],
    };
  }

  let lookups = await getLookups();
  console.log(`📋 Loaded ${lookups.categories.length} categories, ${lookups.accounts.length} accounts`);

  // 4. Entity helpers
  async function ensureAccount(name) {
    if (!name) return null;
    const found = lookups.accounts.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (found) return found.id;
    console.log(`  🆕 Creating account: ${name}`);
    const { data, error } = await supabase
      .from('accounts')
      .insert([{ user_id: uid, name, type: 'bank', balance: 0 }])
      .select('id').single();
    if (error) { console.error(`  ❌ Error creating account "${name}":`, error.message); return null; }
    lookups = await getLookups();
    return data.id;
  }

  async function ensureParty(name) {
    if (!name) return null;
    const found = lookups.parties.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (found) return found.id;
    console.log(`  🆕 Creating party: ${name}`);
    const { data, error } = await supabase
      .from('parties')
      .insert([{ user_id: uid, name }])
      .select('id').single();
    if (error) { console.error(`  ❌ Error creating party "${name}":`, error.message); return null; }
    lookups = await getLookups();
    return data.id;
  }

  async function ensureCategory(rawName, type) {
    if (!rawName) return null;
    const name = normalizeCategoryName(rawName);
    // Match by canonical name and type
    const found = lookups.categories.find(
      c => c.name.toLowerCase() === name.toLowerCase() && c.type === type
    );
    if (found) return found.id;
    // Also try without type constraint (system categories may not have type set)
    const foundAny = lookups.categories.find(
      c => c.name.toLowerCase() === name.toLowerCase()
    );
    if (foundAny) return foundAny.id;

    console.log(`  🆕 Creating category: "${name}" (${type})`);
    const icon = iconForCategory(name);
    const { data, error } = await supabase
      .from('categories')
      .insert([{ user_id: uid, name, type, icon }])
      .select('id').single();
    if (error) { console.error(`  ❌ Error creating category "${name}":`, error.message); return null; }
    lookups = await getLookups();
    return data.id;
  }

  async function ensureTag(name) {
    if (!name) return null;
    const found = lookups.tags.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (found) return found.id;
    const { data, error } = await supabase
      .from('tags')
      .insert([{ user_id: uid, name }])
      .select('id').single();
    if (error) { console.error(`  ❌ Error creating tag "${name}":`, error.message); return null; }
    lookups = await getLookups();
    return data.id;
  }

  // 5. Process rows
  const transactionsToInsert = [];
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const dateRaw = row['Date'];
    if (!dateRaw) { skipped++; continue; }

    // Parse date: M/D/YYYY -> YYYY-MM-DD
    const [m, d, y] = dateRaw.split('/');
    if (!m || !d || !y) { console.warn(`  ⚠️  Row ${i+2}: invalid date "${dateRaw}"`); skipped++; continue; }
    const formattedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

    const incomeRaw  = (row['Income '] || row['Income'] || '').replace(/,/g, '').trim();
    const expenseRaw = (row['Expense'] || '').replace(/,/g, '').trim();

    const isIncome = incomeRaw.length > 0 && parseFloat(incomeRaw) !== 0;
    const amountStr = isIncome ? incomeRaw : expenseRaw;
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount === 0) { skipped++; continue; }

    const type     = isIncome ? 'income' : 'expense';
    const catRaw   = isIncome ? (row['Income Category'] || '') : (row['Expense Category'] || '');
    const tagsRaw  = (row['Tags'] || '').trim();

    const accountId  = await ensureAccount(row['Accounts'] || 'Cash');
    const partyId    = await ensureParty(row['Party'] || '');
    const categoryId = await ensureCategory(catRaw, type);

    const tagNames = tagsRaw.split(/\s+/).filter(t => t.trim().length > 0);

    transactionsToInsert.push({
      tx: {
        user_id:          uid,
        transaction_date: formattedDate,
        amount:           Math.abs(amount),
        type,
        account_id:       accountId,
        party_id:         partyId || null,
        category_id:      categoryId || null,
        note:             row['Details'] || null,
      },
      tagNames,
    });
  }

  console.log(`\n📥 Inserting ${transactionsToInsert.length} transactions (${skipped} skipped)...`);

  // 6. Batch insert transactions in chunks
  const CHUNK_SIZE = 50;
  const allInserted = [];
  for (let i = 0; i < transactionsToInsert.length; i += CHUNK_SIZE) {
    const chunk = transactionsToInsert.slice(i, i + CHUNK_SIZE).map(item => item.tx);
    const { data: inserted, error } = await supabase
      .from('transactions')
      .insert(chunk)
      .select('id');
    if (error) {
      console.error(`❌ Batch insert error (chunk ${Math.floor(i/CHUNK_SIZE)+1}):`, error.message);
      process.exit(1);
    }
    allInserted.push(...inserted);
    process.stdout.write(`  ✓ ${Math.min(i + CHUNK_SIZE, transactionsToInsert.length)}/${transactionsToInsert.length}\r`);
  }
  console.log(`\n✅ Inserted ${allInserted.length} transactions`);

  // 7. Link tags
  const tagLinks = [];
  for (let i = 0; i < allInserted.length; i++) {
    const { tagNames } = transactionsToInsert[i];
    const txId = allInserted[i].id;
    for (const name of tagNames) {
      const tagId = await ensureTag(name);
      if (tagId) tagLinks.push({ transaction_id: txId, tag_id: tagId });
    }
  }

  if (tagLinks.length > 0) {
    const { error } = await supabase.from('transaction_tags').insert(tagLinks);
    if (error) console.error('❌ Tag link error:', error.message);
    else console.log(`🏷️  Linked ${tagLinks.length} tags`);
  }

  console.log('\n🎉 Import complete!');
  console.log(`   Transactions: ${allInserted.length}`);
  console.log(`   Tag links:    ${tagLinks.length}`);
  console.log(`   Skipped rows: ${skipped}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
