import { supabase, isSupabaseConfigured } from '../config/supabase';
import { UserProfile, TrustedContact, CommunityNote, RouteOption } from '../types';
import { INITIAL_USER_PROFILE, TRUSTED_CONTACTS, INITIAL_COMMUNITY_NOTES } from '../data/mockData';

// ---------------------------------------------------------------------------
// Authentication & Session Helper
// ---------------------------------------------------------------------------

export async function getCurrentUser() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;

  // Try retrieving active session
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user;

  // If no session exists yet, automatically sign in anonymously so RLS has an authentic auth.uid()
  try {
    const { data: anonAuth, error } = await supabase.auth.signInAnonymously();
    if (!error && anonAuth.user) {
      return anonAuth.user;
    }
  } catch (e) {
    // If anonymous sign-in is not enabled on the Supabase project, return null
  }

  return null;
}

// ---------------------------------------------------------------------------
// Profile Service Layer
// ---------------------------------------------------------------------------

export async function fetchUserProfile(): Promise<UserProfile> {
  if (!isSupabaseConfigured || !supabase) {
    return INITIAL_USER_PROFILE;
  }

  try {
    const user = await getCurrentUser();
    if (!user) return INITIAL_USER_PROFILE;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) {
      // Derive name directly from authentic auth user
      const authName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'My Profile';
      const authAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || INITIAL_USER_PROFILE.avatarUrl;
      return {
        name: authName,
        avatarUrl: authAvatar,
        savedLocations: [],
      };
    }

    return {
      name: data.name || user.email?.split('@')[0] || 'My Profile',
      avatarUrl: data.avatar_url || INITIAL_USER_PROFILE.avatarUrl,
      savedLocations: data.saved_locations || [],
    };
  } catch (err) {
    console.warn('Supabase fetchUserProfile error:', err);
    return INITIAL_USER_PROFILE;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.error('Supabase is not configured');
    return false;
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('No authenticated user session found when saving profile');
      return false;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: profile.name,
        avatar_url: profile.avatarUrl,
        saved_locations: profile.savedLocations,
        updated_at: new Date().toISOString(),
      });

    return !error;
  } catch (err) {
    console.warn('Supabase saveUserProfile error:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Emergency Contacts Service Layer
// ---------------------------------------------------------------------------

export async function fetchEmergencyContacts(): Promise<TrustedContact[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      phone: item.phone,
      relationship: item.relationship || 'Contact',
      avatarBg: item.avatar_bg || 'bg-purple-600',
    }));
  } catch (err) {
    console.warn('Supabase fetchEmergencyContacts error:', err);
    return [];
  }
}

export async function addEmergencyContact(contact: Omit<TrustedContact, 'id'>): Promise<TrustedContact | null> {
  if (!isSupabaseConfigured || !supabase) {
    console.error('Supabase is not configured');
    return null;
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('No authenticated Supabase user found when adding contact');
      return null;
    }

    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert({
        user_id: user.id,
        name: contact.name,
        phone: contact.phone,
        relationship: contact.relationship,
        avatar_bg: contact.avatarBg,
      })
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      relationship: data.relationship,
      avatarBg: data.avatar_bg,
    };
  } catch (err) {
    console.warn('Supabase addEmergencyContact error:', err);
    return null;
  }
}
export async function updateEmergencyContact(id: string, contact: Partial<Omit<TrustedContact, 'id'>>): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return true;
  }

  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('emergency_contacts')
      .update({
        ...(contact.name ? { name: contact.name } : {}),
        ...(contact.phone ? { phone: contact.phone } : {}),
        ...(contact.relationship ? { relationship: contact.relationship } : {}),
        ...(contact.avatarBg ? { avatar_bg: contact.avatarBg } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  } catch (err) {
    console.warn('Supabase updateEmergencyContact error:', err);
    return false;
  }
}

export async function deleteEmergencyContact(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return true;
  }

  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return !error;
  } catch (err) {
    console.warn('Supabase deleteEmergencyContact error:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Community Notes Service Layer
// ---------------------------------------------------------------------------

export async function fetchCommunityNotes(): Promise<CommunityNote[]> {
  if (!isSupabaseConfigured || !supabase) {
    return INITIAL_COMMUNITY_NOTES;
  }

  try {
    const { data, error } = await supabase
      .from('community_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return INITIAL_COMMUNITY_NOTES;
    }

    return data.map((n) => ({
      id: n.id,
      author: n.author_name,
      category: n.category,
      location: n.location,
      text: n.text,
      timestamp: n.timestamp_text,
      photoUrl: n.photo_url || undefined,
      upvotes: n.upvotes || 0,
      verified: Boolean(n.verified),
    }));
  } catch (err) {
    console.warn('Supabase fetchCommunityNotes fallback:', err);
    return INITIAL_COMMUNITY_NOTES;
  }
}

export async function createCommunityNote(note: CommunityNote): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return true; // Local state preserves it
  }

  try {
    const user = await getCurrentUser();
    const { error } = await supabase
      .from('community_notes')
      .insert({
        user_id: user?.id || null,
        author_name: note.author,
        category: note.category,
        location: note.location,
        text: note.text,
        timestamp_text: note.timestamp,
        photo_url: note.photoUrl || null,
        upvotes: note.upvotes,
        verified: note.verified,
      });

    return !error;
  } catch (err) {
    console.warn('Supabase createCommunityNote error:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Active Journey & ETA Service Layer
// ---------------------------------------------------------------------------

export async function logJourneyStart(
  origin: string,
  destination: string,
  route: RouteOption,
  expectedArrival: string
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('journeys')
      .insert({
        user_id: user.id,
        origin,
        destination,
        route_id: route.id,
        route_name: route.name,
        duration_minutes: route.durationMinutes,
        distance_km: route.distanceKm,
        is_active: true,
        expected_arrival_time: expectedArrival,
      })
      .select('id')
      .single();

    if (error || !data) return null;
    return data.id;
  } catch (err) {
    console.warn('Supabase logJourneyStart error:', err);
    return null;
  }
}

export async function markJourneyComplete(journeyId?: string | null): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !journeyId) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('journeys')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', journeyId);

    return !error;
  } catch (err) {
    console.warn('Supabase markJourneyComplete error:', err);
    return false;
  }
}
