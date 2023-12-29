// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl:string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const validator = async (username: string, password: string) => {
  if (username === "sailendra" && password === "9731339077") {
    return true;
  } else {
    return false;
  }
};
