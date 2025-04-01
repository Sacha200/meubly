import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const furnitures = JSON.parse(fs.readFileSync('data.json', 'utf8'));

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {

    console.log(furnitures);
   
    // // Get all furnitures
    // let { data: Furniture, error } = await supabase
    // .from('Furniture')
    // .select("*")

    // console.log(Furniture);
}

main();
