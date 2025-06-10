
import type { Database } from "@/integrations/supabase/types";

export type TaskBase = Database["public"]["Tables"]["task_requests"]["Row"];

export type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  tasker?: { full_name: string; approved?: boolean; created_at?: string; updated_at?: string };
};

export type TaskInsert = Database["public"]["Tables"]["task_requests"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["task_requests"]["Update"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];

export type Task = TaskBase & {
  offers?: Offer[] | null;
  client?: {
    full_name: string;
    location: string;
  };
};
