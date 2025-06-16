
import { supabase } from "@/integrations/supabase/client";
import type { Task } from "./types";

export const fetchTasks = async (
  userId: string,
  userRole: string
): Promise<Task[]> => {
  console.log("🔍 [TASKS] Fetching tasks for:", userId, "role:", userRole);

  // Quick session check without full validation to avoid timeouts
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.warn("⚠️ [TASKS] No active session, cannot fetch tasks");
      return [];
    }
    
    // Verify the passed userId matches the session user ID
    if (session.user.id !== userId) {
      console.error("❌ [TASKS] User ID mismatch. Session:", session.user.id, "Passed:", userId);
      return [];
    }
  } catch (sessionError) {
    console.error("❌ [TASKS] Session check failed:", sessionError);
    return [];
  }

  try {
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
        offers:offers!task_id (
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
          tasker:users!tasker_id(full_name, approved)
        ),
        client:users!client_id(full_name, location)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [TASKS] Error fetching tasks:", error);
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    if (!data) {
      console.warn("⚠️ [TASKS] No data returned from Supabase");
      return [];
    }

    console.log("✅ [TASKS] Fetched tasks from DB:", data.length);
    
    const normalizedData = data.map((task) => ({
      ...task,
      offers: Array.isArray(task.offers) ? task.offers : (task.offers ? [task.offers] : []),
    })) as Task[];

    console.log("✅ [TASKS] Normalized tasks for frontend:", normalizedData.length);
    return normalizedData;
  } catch (error) {
    console.error("❌ [TASKS] Exception in fetchTasks:", error);
    throw error;
  }
};

export const fetchTask = async (taskId: string): Promise<Task | null> => {
  console.log("🔍 [TASKS] Fetching single task:", taskId);
  
  // Quick session check
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.warn("⚠️ [TASKS] No active session for single task fetch");
      return null;
    }
  } catch (sessionError) {
    console.error("❌ [TASKS] Session check failed for single task:", sessionError);
    return null;
  }

  try {
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
        offers:offers!task_id (
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
          tasker:users!tasker_id(full_name, approved)
        ),
        client:users!client_id(full_name, location)
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
      offers: Array.isArray(data.offers) ? data.offers : (data.offers ? [data.offers] : []),
    } as Task;

    console.log("✅ [TASKS] Fetched single task:", normalized.id, "with", normalized.offers?.length || 0, "offers");
    return normalized;
  } catch (error) {
    console.error("❌ [TASKS] Exception in fetchTask:", error);
    return null;
  }
};
