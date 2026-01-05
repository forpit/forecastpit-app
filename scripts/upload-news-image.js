import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = "https://seybywtqeihxyzmfgjmh.supabase.co";
// Using service role key for admin access to bypass RLS
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNleWJ5d3RxZWloeHl6bWZnam1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzc3NjIsImV4cCI6MjA3Nzc1Mzc2Mn0.-d9sl-bqfPhLTTKgFWYAjgZ-BkN6SVIav54LKt5f3nc";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadNewsImage() {
  // Get image path from command line argument or use default
  const inputPath = process.argv[2] || './news.png';
  const imagePath = resolve(inputPath);
  const imageBuffer = readFileSync(imagePath);

  console.log(`📤 Uploading ${inputPath} to Supabase Storage...`);

  const fileName = `news-${Date.now()}.png`;

  const { data, error } = await supabase.storage
    .from('news-images')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: false
    });

  if (error) {
    console.error('❌ Error uploading image:', error);
    process.exit(1);
  }

  console.log('✅ Image uploaded successfully!');

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('news-images')
    .getPublicUrl(fileName);

  console.log('🔗 Public URL:', urlData.publicUrl);
  console.log('\n📋 Use this URL for your news articles:');
  console.log(urlData.publicUrl);

  return urlData.publicUrl;
}

uploadNewsImage();
