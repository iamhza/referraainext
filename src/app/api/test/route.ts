import { createClient } from '@supabase/supabase-js'
import { MongoClient } from 'mongodb'

interface TestResults {
  supabase: boolean;
  mongodb: boolean;
  errors: string[];
}

export async function GET() {
  const results: TestResults = { supabase: false, mongodb: false, errors: [] }
  
  // Test Supabase connection
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase.from('_tables').select('*').limit(1)
    results.supabase = true
  } catch (error) {
    results.errors.push(`Supabase error: ${error instanceof Error ? error.message : String(error)}`)
  }

  // Test MongoDB connection
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI!)
    await client.db().admin().ping()
    await client.close()
    results.mongodb = true
  } catch (error) {
    results.errors.push(`MongoDB error: ${error instanceof Error ? error.message : String(error)}`)
  }

  return Response.json(results)
} 