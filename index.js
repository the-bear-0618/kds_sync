import fetch from 'node-fetch';

const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_PROJECT_ID || !SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing required environment variables');
  console.error('Please set SUPABASE_PROJECT_ID and SUPABASE_ANON_KEY');
  process.exit(1);
}

// Sleep function for retry delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function syncKDSToAirtable(retryCount = 0) {
  const maxRetries = 3;
  const url = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/supabase-functions-deploy-kds-webhook`;
  
  console.log(`[${new Date().toISOString()}] Starting KDS to Airtable sync... (attempt ${retryCount + 1}/${maxRetries + 1})`);
  console.log(`URL: ${url}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const responseText = await response.text();
    
    if (!response.ok) {
      // Handle specific HTTP errors
      if (response.status === 502 && retryCount < maxRetries) {
        console.log(`⚠️  Got 502 Bad Gateway, waiting 5 seconds before retry...`);
        await sleep(5000);
        return await syncKDSToAirtable(retryCount + 1);
      }
      
      if (response.status === 504 && retryCount < maxRetries) {
        console.log(`⚠️  Got 504 Gateway Timeout, waiting 10 seconds before retry...`);
        await sleep(10000);
        return await syncKDSToAirtable(retryCount + 1);
      }
      
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
    
    console.log('✅ Sync completed successfully!');
    console.log('Response:', data);
    return data;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Sync timed out after 30 seconds');
      if (retryCount < maxRetries) {
        console.log(`⚠️  Retrying after timeout... (attempt ${retryCount + 2}/${maxRetries + 1})`);
        await sleep(5000);
        return await syncKDSToAirtable(retryCount + 1);
      }
    } else if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
      console.error('❌ Network error:', error.message);
      if (retryCount < maxRetries) {
        console.log(`⚠️  Retrying after network error... (attempt ${retryCount + 2}/${maxRetries + 1})`);
        await sleep(3000);
        return await syncKDSToAirtable(retryCount + 1);
      }
    }
    
    console.error('❌ Sync failed:', error.message);
    console.error('Full error:', error);
    
    // Don't exit on error - let Railway cron try again next time
    if (retryCount >= maxRetries) {
      console.error(`❌ Max retries (${maxRetries}) exceeded. Will try again on next cron run.`);
    }
    
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await syncKDSToAirtable();
    console.log('✅ Process completed successfully');
    process.exit(0); // Exit successfully
  } catch (error) {
    console.error('❌ Final error after all retries:', error.message);
    console.log('⏰ Will retry on next scheduled run (15 minutes)');
    process.exit(0); // Exit successfully even on error - let cron retry
  }
}

main();
