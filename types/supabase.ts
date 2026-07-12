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
      projects: {
        Row: {
          id: string;
          title: string;
          project_code: string;
          description: string | null;
          thumbnail_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          project_code: string;
          description?: string | null;
          thumbnail_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          project_code?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      production_environments: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          thumbnail_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          description?: string | null;
          thumbnail_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
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
          status: string;
          job_workflow: string | null;
          scene_workflow: string | null;
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
          status?: string;
          job_workflow?: string | null;
          scene_workflow?: string | null;
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
          status?: string;
          job_workflow?: string | null;
          scene_workflow?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      scenes: {
        Row: {
          id: string;
          episode_id: string;
          scene_name: string;
          description: string | null;
          preview_image: string | null;
          sort_order: number | null;
          status: string;
          workflow: string | null;
          number_of_frames: number;
          priority: number;
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
          status?: string;
          workflow?: string | null;
          number_of_frames?: number;
          priority?: number;
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
          status?: string;
          workflow?: string | null;
          number_of_frames?: number;
          priority?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
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
        Relationships: never[];
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
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
