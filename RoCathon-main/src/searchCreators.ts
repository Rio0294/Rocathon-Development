// Importing necessary modules and libraries
import * as dotenv from 'dotenv';
dotenv.config();
import type { BrandProfile, RankedCreator, Industry } from './types';
import {pipeline} from '@xenova/transformers';
import { createClient } from '@supabase/supabase-js'

// Loading environment variables for Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
     if (!supabaseUrl) {
      throw new Error("SUPABASE_URL is not defined in environment variables.");
     }
     const supabaseServiceRoleKey = process.env.SERVICE_ROLE_KEY;
      if (!supabaseServiceRoleKey) {
        throw new Error("SERVICE_ROLE_KEY is not defined in environment variables.");
      }
      
// Connection with Supabase
console.log("Connecting to Supabase...");
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey,{auth:{persistSession:false}})


/**
 * Search and rank creators for a given natural-language query and brand profile.
 *
 * Your implementation should:
 * 1. Embed the query using a vector embedding model (OpenAI or local)
 * 2. Retrieve the top-N most semantically similar creators from your vector DB
 * 3. Combine semantic_score with projected_score (and any other signals you choose)
 *    to produce a final_score
 * 4. Return the ranked list with scores attached
 *
 * The brandProfile gives you context about the brand's target audience and category.
 * How you use it (or don't) is part of your design.
 */



// searchCreators function to search for creators based on query and brand profile, and return ranked results
export async function searchCreators(query: string, brandProfile: BrandProfile): Promise<RankedCreator[]> 
  {  
  // Initializing pipeline using Transformers.js to generate vector embeddings
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  // Initializing industries and brand id
  const brandindustries = brandProfile.industries;
  const brandid = brandProfile.id;

  // Creating enriched query by combining brand industries, search query and brand id
  const enrichedQuery = `Category: ${brandindustries} | Search: ${query} | BrandID: ${brandid}`;
  const output = await extractor(enrichedQuery, { pooling: 'mean', normalize: true });
  const queryVector = Array.from(output.data);
  
  
  // Calling RPC function in Supabase to perform semantic search based on query embedding and retrieve matching creators
  const {data: creators, error} = await supabase.rpc('semantic_search', {
  query_embedding: queryVector,
  // Assuming a match_threshold of 0.3 to make sure that only creators with good vibe and high GMV are returned
  // Its a very small dataset so we take 0.3 to get good results
  match_threshold: 0.3,
  match_count: 50
  });
  
  // TODO: Embed the query
  // TODO: Retrieve top candidates by cosine similarity from your vector DB
  // TODO: Combine semantic_score with projected_score (and any other signals you choose)
  // TODO: Return ranked list with scores attached
  //throw new Error('Not implemented');

if (error) {
  console.error("Error during semantic search:", error);
  throw error;
}

// Mapping creators to show semantic_score, projected_score and final_score based on the hybrid formula and return the ranked list of creators
const rankresults = creators.map((creator: any) => {

  // semantic_score is cosine similarity score from rpc function defined in Supabase, proportional to vibe match
  const semantic_score = creator.similarity;

  /**
   * projected_score is already given in creators dataset, proportional to GMV
   * This is divided by 100 to convert it to a 0-1 value to be used in the hybrid formula
   **/
  const projected_score = creator.projected_score/100;

  /** 
   * Hybrid formula to calculate final_score 
   * As per the rocathon requirements, "High vibe / zero GMV must rank lower than good vibe / high GMV"
   * We know that projected_score is proportional to GMV and semantic_score is proportional to vibe match
   * So we included projected_score and semantic_score in hybrid formula(given in requirements) to find final_score  
  **/

  // Taking the recommended weights given in challenge
  const final_score = 0.45 * semantic_score + 0.55 * projected_score;
  return {
    // Getting values from Creator data defined in types.ts to display in ranked creator list output
    username: creator.username,
    bio: creator.bio,
    content_style_tags: creator.content_style_tags as Industry[],
    projected_score: creator.projected_score,
    metrics: {
    total_gmv_30d: creator.total_gmv_30d || 0,
    demographics: creator.demographics,
  },
  scores: {
    // Returning scores to the ranked creator list output  
    semantic_score,
    projected_score: creator.projected_score,
    final_score,
  },
}as RankedCreator;
});

// Sorting the ranked creator list output based on final_score in descending order(highest score being on top)
// As per the requirement of the rocathon, we are considering the final_score because it is defined in formula 
// This will ensure that creators with good vibe and high GMV are ranked higher than creators with high vibe but zero GMV
const sort = rankresults.sort((a:any, b:any) =>{
  return b.scores.final_score - a.scores.final_score;
});
return sort;
}
