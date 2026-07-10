import type { TaskStatus } from "@/types/production";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      production_environments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      episodes: {
        Row: {
          id: string;
          environment_id: string;
          episode_name: string;
          description: string | null;
          preview_image: string | null;
          code: string | null;
          start_date: string | null;
          end_date: string | null;
          sort_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          environment_id: string;
          episode_name: string;
          description?: string | null;
          preview_image?: string | null;
          code?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          environment_id?: string;
          episode_name?: string;
          description?: string | null;
          preview_image?: string | null;
          code?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      scenes: {
        Row: {
          id: string;
          episode_id: string;
          scene_name: string;
          description: string | null;
          preview_image: string | null;
          sort_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          episode_id: string;
          scene_name: string;
          description?: string | null;
          preview_image?: string | null;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          episode_id?: string;
          scene_name?: string;
          description?: string | null;
          preview_image?: string | null;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      production_tasks: {
        Row: {
          id: string;
          scene_id: string;
          name: string;
          progress: number;
          status: TaskStatus;
          assignee: string | null;
          start_date: string | null;
          end_date: string | null;
          sort_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scene_id: string;
          name: string;
          progress?: number;
          status?: TaskStatus;
          assignee?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scene_id?: string;
          name?: string;
          progress?: number;
          status?: TaskStatus;
          assignee?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      scene_notes: {
        Row: {
          id: string;
          scene_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scene_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scene_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
