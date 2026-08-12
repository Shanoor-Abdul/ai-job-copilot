const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials in .env")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function setupStorage() {
  console.log("Setting up Supabase Storage...")
  
  // Create bucket
  const { data: buckets, error: getError } = await supabase.storage.listBuckets()
  if (getError) {
    console.error("Failed to list buckets:", getError.message)
    return
  }
  
  const bucketExists = buckets.some((b: any) => b.name === 'resumes')
  
  if (!bucketExists) {
    const { error: createError } = await supabase.storage.createBucket('resumes', {
      public: false,
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      fileSizeLimit: 10485760 // 10MB
    })
    
    if (createError) {
      console.error("Failed to create bucket:", createError.message)
    } else {
      console.log("Created 'resumes' bucket successfully.")
    }
  } else {
    console.log("'resumes' bucket already exists.")
    
    // Ensure it's private and update config
    await supabase.storage.updateBucket('resumes', {
      public: false,
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      fileSizeLimit: 10485760 // 10MB
    })
  }

  // Note: RLS policies for storage cannot be created easily via standard JS client.
  // We'll rely on the service role key for backend access anyway.
  console.log("Storage setup complete.")
}

setupStorage()
