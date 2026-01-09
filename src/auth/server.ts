import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Create a client to interact with Supabase
export async function createClient() {
  const cookieStore = await cookies();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL or ANON KEY is not defined in the environment.");
  }

  const client = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignore errors if called from a Server Component
        }
      },
    },
  });

  return client;
}

// Get the authenticated user
export async function getUser() {
  const { auth } = await createClient();
  const userObject = await auth.getUser();

  if (userObject.error) {
    // Silently return null if no session exists (standard for non-logged in users)
    if (userObject.error.name === 'AuthSessionMissingError' || userObject.error.message?.includes('session missing')) {
      return null;
    }
    console.error("Supabase Auth Error:", userObject.error);
    return null;
  }

  return userObject.data.user;
}
