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
      asset_storage_locations: {
        Row: {
          id: string;
          asset_id: string;
          provider: string;
          root_folder_id: string;
          project_folder_id: string | null;
          category_folder_id: string | null;
          asset_folder_id: string;
          source_folder_id: string;
          preview_folder_id: string;
          versions_folder_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          provider: string;
          root_folder_id: string;
          project_folder_id?: string | null;
          category_folder_id?: string | null;
          asset_folder_id: string;
          source_folder_id: string;
          preview_folder_id: string;
          versions_folder_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          provider?: string;
          root_folder_id?: string;
          project_folder_id?: string | null;
          category_folder_id?: string | null;
          asset_folder_id?: string;
          source_folder_id?: string;
          preview_folder_id?: string;
          versions_folder_id?: string;
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
          provider: string | null;
          drive_file_id: string | null;
          drive_parent_folder_id: string | null;
          original_file_name: string | null;
          extension: string | null;
          mime_type: string | null;
          file_role: string | null;
          version_number: number | null;
          drive_created_time: string | null;
          upload_status: string | null;
          source_file_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          asset_id: string;
          file_name: string;
          file_url: string;
          file_format: string;
          file_size_bytes?: number;
          created_at?: string;
          provider?: string | null;
          drive_file_id?: string | null;
          drive_parent_folder_id?: string | null;
          original_file_name?: string | null;
          extension?: string | null;
          mime_type?: string | null;
          file_role?: string | null;
          version_number?: number | null;
          drive_created_time?: string | null;
          upload_status?: string | null;
          source_file_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          asset_id?: string;
          file_name?: string;
          file_url?: string;
          file_format?: string;
          file_size_bytes?: number;
          created_at?: string;
          provider?: string | null;
          drive_file_id?: string | null;
          drive_parent_folder_id?: string | null;
          original_file_name?: string | null;
          extension?: string | null;
          mime_type?: string | null;
          file_role?: string | null;
          version_number?: number | null;
          drive_created_time?: string | null;
          upload_status?: string | null;
          source_file_id?: string | null;
          updated_at?: string | null;
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
      asset_project_links: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_project_links_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_project_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      };
      asset_environment_links: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          environment_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          environment_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          environment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_environment_links_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_environment_links_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "production_environments"
            referencedColumns: ["id"]
          },
        ]
      };
      asset_job_links: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          episode_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          episode_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          episode_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_job_links_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_job_links_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      };
      asset_scene_links: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          scene_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          scene_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          scene_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_scene_links_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_scene_links_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      };
      storage_connections: {
        Row: {
          id: string
          provider: string
          connection_name: string | null
          account_label: string | null
          encrypted_refresh_token: string
          root_folder_id: string | null
          status: string
          last_connected_at: string | null
          last_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider: string
          connection_name?: string | null
          account_label?: string | null
          encrypted_refresh_token: string
          root_folder_id?: string | null
          status: string
          last_connected_at?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider?: string
          connection_name?: string | null
          account_label?: string | null
          encrypted_refresh_token?: string
          root_folder_id?: string | null
          status?: string
          last_connected_at?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};


