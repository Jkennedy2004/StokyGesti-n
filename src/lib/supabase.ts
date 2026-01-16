import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las credenciales de Supabase. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env')
}

// Cliente de Supabase sin tipos genéricos para evitar errores de TypeScript
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
