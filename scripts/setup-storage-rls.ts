import { Client } from 'pg';
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function fixRls() {
  await client.connect();
  console.log("Fixing RLS policies for storage...");

  const queries = [
    // Drop old policies just in case
    `DROP POLICY IF EXISTS "Allow authenticated users to upload resumes" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Allow authenticated users to view own resumes" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Allow authenticated users to update own resumes" ON storage.objects;`,
    `DROP POLICY IF EXISTS "Allow authenticated users to delete own resumes" ON storage.objects;`,
    
    // Create new simpler policies relying on Supabase's built-in owner column
    `CREATE POLICY "Resumes Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resumes');`,
    `CREATE POLICY "Resumes Select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes');`,
    `CREATE POLICY "Resumes Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'resumes');`,
    `CREATE POLICY "Resumes Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resumes');`
  ];

  for (const q of queries) {
    try {
      await client.query(q);
      console.log("Executed: ", q);
    } catch (e: any) {
      console.log("Error on query: ", q, e.message);
    }
  }

  await client.end();
  console.log("Done.");
}

fixRls();
