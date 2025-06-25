import fetch from 'node-fetch';

// Get environment variables
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_PROJECT_ID || !SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing required environment variables');
  console.error('Please set SUPABASE_PROJECT_ID and SUPABASE_ANON_KEY');
  process.exit(1);
}

async function syncKDSToAirtable() {
  const url = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/sync-kds-to-airtable`;
  
  console.log(`[${new Date().toISOString()}] Starting KDS to Airtable sync...`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    // Try to parse as JSON, but handle plain text responses too
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
    
    console.log('✅ Sync completed successfully!');
    console.log('Response:', data);
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the sync
syncKDSToAirtable()
  .then(() => {
    console.log('Process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
