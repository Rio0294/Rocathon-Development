# Rocathon-Development
Build a creator search engine for Rocathon, where users can search creators that have a perfect balance of good vibe and high GMV.
### Setup instructions for opening the folder and files

### Clone the repository link and install dependencies
```bash
git clone https://github.com/Rio0294/Rocathon-Development.git
cd roc-hackathon
npm install
```

### Configure the environment
```bash
cp .env.example .env
# Fill in your keys for SUPABASE_URL and SERVICE_ROLE_KEY
```
### Setting up the database

**1.** Create a free project at Supabase.com

**2.** Enable the 'pgvector' extension in the SQL editor of the Supabase project  
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector ;
   ```
**3.** Schema definition for the table "creators" 
   ```sql
   CREATE TABLE IF NOT EXISTS creators(
   username TEXT,
   bio TEXT,
   content_style_tags TEXT[],
   projected_score NUMERIC,
   follower_count NUMERIC,
   total_gmv_30d NUMERIC,
   avg_views_30d NUMERIC,
   engagement_rate NUMERIC,
   gpm NUMERIC,
   demographics JSONB,
   embed vector(384)
   );
   ```
**4.** HNSW index for pgvector  
```sql

CREATE INDEX ON creators
USING hnsw(embed vector_cosine_ops);
```
**5.** RPC function for semantic_search 
  ```sql
  CREATE OR REPLACE FUNCTION semantic_search(
  query_embedding vector(384),
  match_threshold float,
  match_count int
  )
returns table(
  username text,
  bio text,
  content_style_tags text[],
  projected_score numeric,
  follower_count numeric,
  total_gmv_30d numeric,
  avg_views_30d numeric,
  engagement_rate numeric,
  gpm numeric,
  demographics JSONB,
  similarity float
)
language sql
as $$
select 
    username, 
    bio, 
    content_style_tags, 
    projected_score, 
    follower_count, 
    total_gmv_30d, 
    avg_views_30d, 
    engagement_rate, 
    gpm, 
    demographics, 
     (1 - (creators.embed <=> query_embedding)) as similarity 
from creators
where creators.embed <=> query_embedding < 1- match_threshold
order by creators.embed <=> query_embedding asc
limit least(match_count, 50)
$$ 
```
## Ingestion of creators.json
**1.** Place the creators.json file inside the root of project directory (same as package.json)
**2.** Run the file ingest.ts
```bash
npm run ingest
```
This ingest.ts file will:
- Get and read the creators.json dataset
- Connect with Supabase 
- Generate vector embeddings using the Transformers.js library, 'Xenova/all-MiniLM-L6-v2' model
- Finally, upload data along with vector embeddings in Supabase

## Running the demo.js file
Run the file demo.ts
```bash
npm run demo
```
This demo.ts file will: 
- Call the searchCreators function to search for creators matching the search query: "Affordable home decor for small apartments"
- Use the profile "brand_smart_home"
- Slice and get the top 10 results.
- Save these top 10 results to a JSON file



