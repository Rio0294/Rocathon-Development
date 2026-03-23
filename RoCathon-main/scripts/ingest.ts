
// Importing necessary modules and libraries
import fs from "fs"
import { pipeline } from '@xenova/transformers';
import { createClient } from '@supabase/supabase-js'
import path from 'path';
import dotenv from 'dotenv' 
import { Creator } from '../src/types';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Loading environment variables for Supabase connection
    const supabaseUrl = process.env.SUPABASE_URL;
     if (!supabaseUrl) {
      throw new Error("SUPABASE_URL is not defined in environment variables.");
     }
     const supabaseServiceRoleKey = process.env.SERVICE_ROLE_KEY;
      if (!supabaseServiceRoleKey) {
        throw new Error("SERVICE_ROLE_KEY is not defined in environment variables.");
      }
      
      console.log("Connecting to Supabase...");

// Connection with Supabase
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey,{auth:{persistSession:false}}) 


// Reading creators dataset from local JSON file
const file_path = path.resolve(process.cwd(), 'creators.json');
const rawdata = fs.readFileSync(file_path, 'utf-8')
const creators: Creator[] = JSON.parse(rawdata)

// Combining creator bios and tags into a single string summaries for embedding
const summaries = creators.map((user: Creator) => {
    const tagstring = user.content_style_tags.join(",")
    
 return `Bio:${user.bio}|Tags:${tagstring}`
})

// Function created to embed summaries for vector embedding
export async function VectorEmbed() {
  try {
  // Initializing pipelines using Transformers.js to generate vector embeddings
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

// Looping through each creator to embed it
    for (let i = 0; i < summaries.length; i++) {
      const output = await extractor(summaries[i], { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data);
      console.log(`Processing Creator ${i}...`);
      
 // Upload to Supabase with data and vector embedding
      const { error } = await supabase.from('creators')
        .insert({
          username: creators[i].username,
          bio: creators[i].bio,
          content_style_tags: creators[i].content_style_tags,
          follower_count: creators[i].metrics.follower_count,
          projected_score: creators[i].projected_score,
          total_gmv_30d: creators[i].metrics.total_gmv_30d,
            avg_views_30d: creators[i].metrics.avg_views_30d,
            engagement_rate: creators[i].metrics.engagement_rate,
            gpm: creators[i].metrics.gpm,
            demographics: creators[i].metrics.demographics,
          embed: vector
        });
      if (error) {
        console.error(`Error inserting creator ${i}:`, error.message);
      } else {
        console.log(`Creator ${i} uploaded successfully.`);
      }
    } 
    
    console.log(`\n Finished! Processed ${summaries.length} creators.`);
  } catch (error) {
    console.error("Embedding error:", error);
  }
}
// Calling the vector embedding function to process and upload to Supabase
VectorEmbed();