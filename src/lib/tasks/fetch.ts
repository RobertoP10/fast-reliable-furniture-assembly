
import { supabase } from "@/integrations/supabase/client";
import type { Task } from "./types";

export const fetchTasks = async (
  userId: string,
  userRole: string
): Promise<Task[]> => {
  console.log("🔍 [TASKS] Fetching tasks for:", userId, "role:", userRole);

  // Ensure we have a valid session before making requests
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error("❌ [TASKS] No valid session:", sessionError);
    throw new Error("Authentication required");
  }

  console.log("✅ [TASKS] Session validated, making request with auth.uid():", session.user.id);

  let query = supabase
    .from("task_requests")
    .select(`
      id,
      client_id,
      title,
      description,
      category,
      subcategory,
      price_range_min,
      price_range_max,
      location,
      payment_method,
      status,
      accepted_offer_id,
      required_date,
      required_time,
      completion_proof_urls,
      completed_at,
      cancelled_at,
      cancellation_reason,
      created_at,
      offers:offers_task_id_fkey (
        id,
        task_id,
        tasker_id,
        price,
        message,
        proposed_date,
        proposed_time,
        is_accepted,
        status,
        created_at,
        updated_at,
        tasker:users!offers_tasker_id_fkey(full_name, approved)
      ),
      client:users!task_requests_client_id_fkey(full_name, location)
    `)
    .order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("❌ [TASKS] RLS Error fetching tasks:", error);
    console.error("❌ [TASKS] Error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  if (!data) {
    console.warn("⚠️ [TASKS] No data returned from Supabase");
    return [];
  }

  console.log("✅ [TASKS] Raw data from Supabase:", data.length, "tasks");
  console.log("🔍 [TASKS] Sample task data:", data[0] ? {
    id: data[0].id,
    status: data[0].status,
    client_id: data[0].client_id,
    accepted_offer_id: data[0].accepted_offer_id,
    offers_count: data[0].offers?.length || 0
  } : "No tasks");

  const normalizedData = data.map((task) => ({
    ...task,
    offers: Array.isArray(task.offers)
      ? task.offers
      : task.offers
      ? [task.offers]
      : null,
  })) as Task[];

  console.log("✅ [TASKS] Normalized tasks for frontend:", normalizedData.length);
  return normalizedData;
};

export const fetchTask = async (taskId: string): Promise<Task | null> => {
  console.log("🔍 [TASKS] Fetching single task:", taskId);
  
  // Ensure we have a valid session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error("❌ [TASKS] No valid session for single task fetch:", sessionError);
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase
    .from("task_requests")
    .select(`
      id,
      client_id,
      title,
      description,
      category,
      subcategory,
      price_range_min,
      price_range_max,
      location,
      payment_method,
      status,
      accepted_offer_id,
      required_date,
      required_time,
      completion_proof_urls,
      completed_at,
      cancelled_at,
      cancellation_reason,
      created_at,
      offers:offers_task_id_fkey (
        id,
        task_id,
        tasker_id,
        price,
        message,
        proposed_date,
        proposed_time,
        is_accepted,
        status,
        created_at,
        updated_at,
        tasker:users!offers_tasker_id_fkey(full_name, approved)
      ),
      client:users!task_requests_client_id_fkey(full_name, location)
    `)
    .eq("id", taskId)
    .single();

  if (error) {
    console.error("❌ [TASKS] Error fetching task:", error);
    return null;
  }

  if (!data) {
    console.warn("⚠️ [TASKS] No data returned for task:", taskId);
    return null;
  }

  const normalized = {
    ...data,
    offers: Array.isArray(data.offers)
      ? data.offers
      : data.offers
      ? [data.offers]
      : null,
  } as Task;

  console.log("✅ [TASKS] Fetched single task:", normalized.id, "with", normalized.offers?.length || 0, "offers");
  return normalized;
};
