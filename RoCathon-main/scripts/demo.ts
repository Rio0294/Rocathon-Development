// Importing necessary modules and libraries

import { searchCreators } from "../src/searchCreators";
import { BrandProfile } from "../src/types";
import fs from 'fs';

/**
 * Sample Query and brand profile for searching creators
 * Values chosen for query `"Affordable home decor for small apartments"` using the `brand_smart_home` profile
 */

const brand: BrandProfile = {
  id: "brand_smart_home",
  industries: ['Home'],
  target_audience: { gender: 'FEMALE', age_ranges: ['18-24', '25-34'] },
  gmv: 1000000
};

// Sample Query to search for creators given in requirements
const query = "Affordable home decor for small apartments";

console.log("Searching for creators matching brand profile...");

// Calling searchCreators function with query and brandprofile parameters
searchCreators(query, brand)
  .then(results => {
    console.log(results);

    // Getting top 10 results as per requirements
    const top10 = results.slice(0, 10);

    // Saving top 10 results to the JSON file
    fs.writeFileSync('top_10_results.json', JSON.stringify(top10, null, 2),'utf-8');

    console.log(`Top 10 results saved to top_10_results.json as JSON`);
    })
  .catch(error => {
    console.error("Error during search:", error);
  });