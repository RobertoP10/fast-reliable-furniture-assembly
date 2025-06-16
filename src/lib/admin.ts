
import { supabase } from "@/integrations/supabase/client";

export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return [];
  }
};

export const updateUserApproval = async (userId: string, approved: boolean) => {
  try {
    const { error } = await supabase
      .from("users")
      .update({ approved })
      .eq("id", userId as any);

    if (error) {
      console.error("Error updating user approval:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in updateUserApproval:", error);
    return { success: false, error: error.message };
  }
};

export const getPendingTaskers = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", "tasker" as any)
      .eq("approved", false as any)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending taskers:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getPendingTaskers:", error);
    return [];
  }
};

export const getAllTransactions = async () => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        task_requests(title),
        client:users!transactions_client_id_fkey(full_name),
        tasker:users!transactions_tasker_id_fkey(full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAllTransactions:", error);
    return [];
  }
};

export const updateTransactionStatus = async (transactionId: string, status: string) => {
  try {
    const { error } = await supabase
      .from("transactions")
      .update({ 
        status: status as any,
        admin_confirmed_at: new Date().toISOString(),
        admin_confirmed_by: (await supabase.auth.getUser()).data.user?.id as any
      })
      .eq("id", transactionId as any);

    if (error) {
      console.error("Error updating transaction status:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in updateTransactionStatus:", error);
    return { success: false, error: error.message };
  }
};
