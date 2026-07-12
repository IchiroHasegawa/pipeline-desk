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
      asset_categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      assets: {
        Row: {
          id: string;
          asset_name: string;
          asset_code: string;
          description: string | null;
          priority: number;
          category_id: string | null;
          asset_type: string;
          workflow: string | null;
          tags: string[] | null;
          preview_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          asset_name: string;
          asset_code: string;
          description?: string | null;
          priority?: number;
          category_id?: string | null;
          asset_type: string;
          workflow?: string | null;
          tags?: string[] | null;
          preview_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          asset_name?: string;
          asset_code?: string;
          description?: string | null;
          priority?: number;
          category_id?: string | null;
          asset_type?: string;
          workflow?: string | null;
          tags?: string[] | null;
          preview_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      asset_files: {
        Row: {
          id: string;
          asset_id: string;
          file_name: string;
          file_url: string;
          file_format: string;
          file_size_bytes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          file_name: string;
          file_url: string;
          file_format: string;
          file_size_bytes?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          file_name?: string;
          file_url?: string;
          file_format?: string;
          file_size_bytes?: number;
          created_at?: string;
        };
        Relationships: never[];
      };
      asset_assignments: {
        Row: {
          id: string;
          asset_id: string;
          project_id: string | null;
          environment_id: string | null;
          episode_id: string | null;
          scene_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          project_id?: string | null;
          environment_id?: string | null;
          episode_id?: string | null;
          scene_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          project_id?: string | null;
          environment_id?: string | null;
          episode_id?: string | null;
          scene_id?: string | null;
          created_at?: string;
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


