import { Client } from 'pg';
import 'dotenv/config';

const supabaseUrl = 'postgresql://postgres.htkivrazsepiaulahysi:Albayaan%40top1@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
const neonUrl = process.env.DATABASE_URL;

const tables = [
  'schools',
  'users',
  'sessions',
  'terms',
  'classes',
  'subjects',
  'class_subjects',
  'students',
  'student_parents',
  'result_sheets',
  'student_results',
  'subject_scores',
  'student_attendance',
  'staff_attendance',
  'admission_sequences',
  'role_permissions'
];

async function run() {
  const supabase = new Client({ connectionString: supabaseUrl, ssl: { rejectUnauthorized: false } });
  const neon = new Client({ connectionString: neonUrl });

  await supabase.connect();
  await neon.connect();

  for (const table of tables) {
    console.log(`Processing table ${table}...`);
    try {
      // Get columns in Supabase
      const resSupaCols = await supabase.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`, [table]);
      const supaCols = resSupaCols.rows.map(r => r.column_name);
      
      // Get columns in Neon
      const resNeonCols = await neon.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`, [table]);
      const neonCols = resNeonCols.rows.map(r => r.column_name);
      
      // Find intersection
      const sharedCols = supaCols.filter(c => neonCols.includes(c));
      
      if (sharedCols.length === 0) {
        console.log(`No shared columns for table ${table}, skipping.`);
        continue;
      }
      
      const selectCols = sharedCols.map(c => `"${c}"`).join(', ');
      
      const res = await supabase.query(`SELECT ${selectCols} FROM "${table}"`);
      if (res.rows.length === 0) {
        console.log(`Table ${table} is empty, skipping.`);
        continue;
      }
      
      let inserted = 0;
      for (const row of res.rows) {
        const placeholders = sharedCols.map((_, i) => `$${i + 1}`).join(', ');
        const values = sharedCols.map(c => {
          const val = row[c];
          if (val !== null && typeof val === 'object' && !(val instanceof Date) && !Buffer.isBuffer(val)) {
            return JSON.stringify(val);
          }
          return val;
        });
        
        try {
          await neon.query(`INSERT INTO "${table}" (${selectCols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values);
          inserted++;
        } catch (e) {
          console.error(`Error inserting into ${table}:`, e.message);
        }
      }
      console.log(`Copied ${inserted}/${res.rows.length} rows for ${table}.`);
    } catch (e) {
      console.error(`Error reading from ${table}:`, e.message);
    }
  }

  await supabase.end();
  await neon.end();
}

run().catch(console.error);
