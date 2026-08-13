export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      asset_assignments: {
        Row: {
          asset_id: string
          created_at: string
          environment_id: string | null
          episode_id: string | null
          id: string
          project_id: string | null
          scene_id: string | null
        }
        Insert: {
          asset_id: string
          created_at?: string
          environment_id?: string | null
          episode_id?: string | null
          id?: string
          project_id?: string | null
          scene_id?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string
          environment_id?: string | null
          episode_id?: string | null
          id?: string
          project_id?: string | null
          scene_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "production_environments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      asset_environment_links: {
        Row: {
          asset_id: string
          created_at: string
          environment_id: string
          id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          environment_id: string
          id?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          environment_id?: string
          id?: string
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
      }
      asset_files: {
        Row: {
          asset_id: string
          created_at: string
          current_file_id: string | null
          display_name: string | null
          drive_created_time: string | null
          drive_file_id: string | null
          drive_parent_folder_id: string | null
          extension: string | null
          file_format: string
          file_name: string
          file_role: string | null
          file_size_bytes: number
          file_url: string
          id: string
          mime_type: string | null
          original_file_name: string | null
          provider: string | null
          record_status: string | null
          restored_from_file_id: string | null
          source_file_id: string | null
          updated_at: string | null
          version_number: number | null
        }
        Insert: {
          asset_id: string
          created_at?: string
          current_file_id?: string | null
          display_name?: string | null
          drive_created_time?: string | null
          drive_file_id?: string | null
          drive_parent_folder_id?: string | null
          extension?: string | null
          file_format: string
          file_name: string
          file_role?: string | null
          file_size_bytes?: number
          file_url: string
          id?: string
          mime_type?: string | null
          original_file_name?: string | null
          provider?: string | null
          record_status?: string | null
          restored_from_file_id?: string | null
          source_file_id?: string | null
          updated_at?: string | null
          version_number?: number | null
        }
        Update: {
          asset_id?: string
          created_at?: string
          current_file_id?: string | null
          display_name?: string | null
          drive_created_time?: string | null
          drive_file_id?: string | null
          drive_parent_folder_id?: string | null
          extension?: string | null
          file_format?: string
          file_name?: string
          file_role?: string | null
          file_size_bytes?: number
          file_url?: string
          id?: string
          mime_type?: string | null
          original_file_name?: string | null
          provider?: string | null
          record_status?: string | null
          restored_from_file_id?: string | null
          source_file_id?: string | null
          updated_at?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_files_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_files_current_file_id_fkey"
            columns: ["current_file_id"]
            isOneToOne: false
            referencedRelation: "asset_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_files_restored_from_file_id_fkey"
            columns: ["restored_from_file_id"]
            isOneToOne: false
            referencedRelation: "asset_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_files_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "asset_files"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_job_links: {
        Row: {
          asset_id: string
          created_at: string
          episode_id: string
          id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          episode_id: string
          id?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          episode_id?: string
          id?: string
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
      }
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
      }
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
      }
      asset_storage_locations: {
        Row: {
          asset_folder_id: string
          asset_id: string
          category_folder_id: string | null
          created_at: string
          id: string
          preview_folder_id: string
          project_folder_id: string | null
          provider: string
          root_folder_id: string
          source_folder_id: string
          updated_at: string
          versions_folder_id: string
        }
        Insert: {
          asset_folder_id: string
          asset_id: string
          category_folder_id?: string | null
          created_at?: string
          id?: string
          preview_folder_id: string
          project_folder_id?: string | null
          provider: string
          root_folder_id: string
          source_folder_id: string
          updated_at?: string
          versions_folder_id: string
        }
        Update: {
          asset_folder_id?: string
          asset_id?: string
          category_folder_id?: string | null
          created_at?: string
          id?: string
          preview_folder_id?: string
          project_folder_id?: string | null
          provider?: string
          root_folder_id?: string
          source_folder_id?: string
          updated_at?: string
          versions_folder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_storage_locations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_tasks: {
        Row: {
          asset_id: string
          assignee: string | null
          assignee_group_id: string | null
          created_at: string
          duration_days: number | null
          effort_hours: number | null
          end_date: string | null
          id: string
          name: string
          progress: number
          sort_order: number | null
          source_workflow_id: string | null
          source_workflow_process_id: string | null
          start_date: string | null
          status: string
          take_retake_count: number | null
          take_retake_mode: string | null
          task_status_definition_id: string | null
          task_status_workflow_id: string | null
          updated_at: string
        }
        Insert: {
          asset_id: string
          assignee?: string | null
          assignee_group_id?: string | null
          created_at?: string
          duration_days?: number | null
          effort_hours?: number | null
          end_date?: string | null
          id?: string
          name: string
          progress?: number
          sort_order?: number | null
          source_workflow_id?: string | null
          source_workflow_process_id?: string | null
          start_date?: string | null
          status?: string
          take_retake_count?: number | null
          take_retake_mode?: string | null
          task_status_definition_id?: string | null
          task_status_workflow_id?: string | null
          updated_at?: string
        }
        Update: {
          asset_id?: string
          assignee?: string | null
          assignee_group_id?: string | null
          created_at?: string
          duration_days?: number | null
          effort_hours?: number | null
          end_date?: string | null
          id?: string
          name?: string
          progress?: number
          sort_order?: number | null
          source_workflow_id?: string | null
          source_workflow_process_id?: string | null
          start_date?: string | null
          status?: string
          take_retake_count?: number | null
          take_retake_mode?: string | null
          task_status_definition_id?: string | null
          task_status_workflow_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_tasks_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_tasks_source_workflow_id_fkey"
            columns: ["source_workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_tasks_source_workflow_process_id_fkey"
            columns: ["source_workflow_process_id"]
            isOneToOne: false
            referencedRelation: "workflow_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_tasks_task_status_definition_id_fkey"
            columns: ["task_status_definition_id"]
            isOneToOne: false
            referencedRelation: "workflow_task_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_tasks_task_status_workflow_id_fkey"
            columns: ["task_status_workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_code: string
          asset_name: string
          asset_type: string
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          preview_url: string | null
          priority: number
          sort_order: number
          status: string
          tags: string[] | null
          updated_at: string
          workflow: string | null
        }
        Insert: {
          asset_code: string
          asset_name: string
          asset_type: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          preview_url?: string | null
          priority?: number
          sort_order?: number
          status?: string
          tags?: string[] | null
          updated_at?: string
          workflow?: string | null
        }
        Update: {
          asset_code?: string
          asset_name?: string
          asset_type?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          preview_url?: string | null
          priority?: number
          sort_order?: number
          status?: string
          tags?: string[] | null
          updated_at?: string
          workflow?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "asset_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      board_elements: {
        Row: {
          asset_file_id: string | null
          asset_id: string | null
          board_id: string
          body: string | null
          colour: string | null
          created_at: string
          created_by: string | null
          element_type: string
          from_element_id: string | null
          height: number | null
          id: string
          image_url: string | null
          keyframe_number: number | null
          parent_folder_id: string | null
          title: string | null
          to_element_id: string | null
          updated_at: string
          width: number | null
          x: number
          y: number
          z_index: number
        }
        Insert: {
          asset_file_id?: string | null
          asset_id?: string | null
          board_id: string
          body?: string | null
          colour?: string | null
          created_at?: string
          created_by?: string | null
          element_type: string
          from_element_id?: string | null
          height?: number | null
          id?: string
          image_url?: string | null
          keyframe_number?: number | null
          parent_folder_id?: string | null
          title?: string | null
          to_element_id?: string | null
          updated_at?: string
          width?: number | null
          x?: number
          y?: number
          z_index?: number
        }
        Update: {
          asset_file_id?: string | null
          asset_id?: string | null
          board_id?: string
          body?: string | null
          colour?: string | null
          created_at?: string
          created_by?: string | null
          element_type?: string
          from_element_id?: string | null
          height?: number | null
          id?: string
          image_url?: string | null
          keyframe_number?: number | null
          parent_folder_id?: string | null
          title?: string | null
          to_element_id?: string | null
          updated_at?: string
          width?: number | null
          x?: number
          y?: number
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "board_elements_asset_file_id_fkey"
            columns: ["asset_file_id"]
            isOneToOne: false
            referencedRelation: "asset_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_elements_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_elements_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_elements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_elements_from_element_id_fkey"
            columns: ["from_element_id"]
            isOneToOne: false
            referencedRelation: "board_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_elements_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "board_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_elements_to_element_id_fkey"
            columns: ["to_element_id"]
            isOneToOne: false
            referencedRelation: "board_elements"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          created_at: string
          id: string
          project_id: string | null
          scene_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id?: string | null
          scene_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string | null
          scene_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boards_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      days: {
        Row: {
          created_at: string
          day_date: string
          description: string | null
          episode_id: string
          id: string
          sort_order: number | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_date: string
          description?: string | null
          episode_id: string
          id?: string
          sort_order?: number | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_date?: string
          description?: string | null
          episode_id?: string
          id?: string
          sort_order?: number | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "days_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          end_date: string | null
          environment_id: string | null
          episode_name: string
          id: string
          job_workflow: string | null
          preview_image: string | null
          project_id: string
          scene_workflow: string | null
          sort_order: number | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          environment_id?: string | null
          episode_name: string
          id?: string
          job_workflow?: string | null
          preview_image?: string | null
          project_id: string
          scene_workflow?: string | null
          sort_order?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          environment_id?: string | null
          episode_name?: string
          id?: string
          job_workflow?: string | null
          preview_image?: string | null
          project_id?: string
          scene_workflow?: string | null
          sort_order?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "production_environments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      production_environments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          status: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_environments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      production_tasks: {
        Row: {
          assignee: string | null
          assignee_group_id: string | null
          branches_from_task_id: string | null
          contributes_to_task_id: string | null
          created_at: string
          day_id: string | null
          duration_days: number | null
          effort_hours: number | null
          end_date: string | null
          environment_id: string | null
          episode_id: string | null
          id: string
          name: string
          progress: number
          scene_id: string | null
          sort_order: number | null
          source_workflow_id: string | null
          source_workflow_process_id: string | null
          start_date: string | null
          status: string
          take_retake_count: number | null
          take_retake_mode: string | null
          task_status_definition_id: string | null
          task_status_workflow_id: string | null
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          assignee_group_id?: string | null
          branches_from_task_id?: string | null
          contributes_to_task_id?: string | null
          created_at?: string
          day_id?: string | null
          duration_days?: number | null
          effort_hours?: number | null
          end_date?: string | null
          environment_id?: string | null
          episode_id?: string | null
          id?: string
          name: string
          progress?: number
          scene_id?: string | null
          sort_order?: number | null
          source_workflow_id?: string | null
          source_workflow_process_id?: string | null
          start_date?: string | null
          status?: string
          take_retake_count?: number | null
          take_retake_mode?: string | null
          task_status_definition_id?: string | null
          task_status_workflow_id?: string | null
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          assignee_group_id?: string | null
          branches_from_task_id?: string | null
          contributes_to_task_id?: string | null
          created_at?: string
          day_id?: string | null
          duration_days?: number | null
          effort_hours?: number | null
          end_date?: string | null
          environment_id?: string | null
          episode_id?: string | null
          id?: string
          name?: string
          progress?: number
          scene_id?: string | null
          sort_order?: number | null
          source_workflow_id?: string | null
          source_workflow_process_id?: string | null
          start_date?: string | null
          status?: string
          take_retake_count?: number | null
          take_retake_mode?: string | null
          task_status_definition_id?: string | null
          task_status_workflow_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_tasks_branches_from_task_id_fkey"
            columns: ["branches_from_task_id"]
            isOneToOne: false
            referencedRelation: "production_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_tasks_contributes_to_task_id_fkey"
            columns: ["contributes_to_task_id"]
            isOneToOne: false
            referencedRelation: "production_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_tasks_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_tasks_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "production_environments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_tasks_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_tasks_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_tasks_source_workflow_id_fkey"
            columns: ["source_workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_tasks_source_workflow_process_id_fkey"
            columns: ["source_workflow_process_id"]
            isOneToOne: false
            referencedRelation: "workflow_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_tasks_task_status_definition_id_fkey"
            columns: ["task_status_definition_id"]
            isOneToOne: false
            referencedRelation: "workflow_task_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_tasks_task_status_workflow_id_fkey"
            columns: ["task_status_workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          system_role: string
          updated_at: string
          username: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          system_role?: string
          updated_at?: string
          username: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          system_role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_system: boolean
          project_code: string
          start_date: string | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_system?: boolean
          project_code: string
          start_date?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_system?: boolean
          project_code?: string
          start_date?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      scene_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          scene_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          scene_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          scene_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scene_notes_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      scenes: {
        Row: {
          created_at: string
          description: string | null
          episode_id: string
          id: string
          number_of_frames: number
          preview_image: string | null
          priority: number
          scene_name: string
          sort_order: number | null
          status: string
          updated_at: string
          workflow: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          episode_id: string
          id?: string
          number_of_frames?: number
          preview_image?: string | null
          priority?: number
          scene_name: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          workflow?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          episode_id?: string
          id?: string
          number_of_frames?: number
          preview_image?: string | null
          priority?: number
          scene_name?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          workflow?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenes_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_connections: {
        Row: {
          account_label: string | null
          connection_name: string | null
          created_at: string
          encrypted_refresh_token: string
          id: string
          last_connected_at: string | null
          last_error: string | null
          provider: string
          root_folder_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_label?: string | null
          connection_name?: string | null
          created_at?: string
          encrypted_refresh_token: string
          id?: string
          last_connected_at?: string | null
          last_error?: string | null
          provider: string
          root_folder_id?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          account_label?: string | null
          connection_name?: string | null
          created_at?: string
          encrypted_refresh_token?: string
          id?: string
          last_connected_at?: string | null
          last_error?: string | null
          provider?: string
          root_folder_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          episode_id: string | null
          id: string
          scene_id: string | null
          sort_order: number | null
          task_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          episode_id?: string | null
          id?: string
          scene_id?: string | null
          sort_order?: number | null
          task_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          episode_id?: string | null
          id?: string
          scene_id?: string | null
          sort_order?: number | null
          task_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "production_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_processes: {
        Row: {
          assignee_group_id: string | null
          colour: string
          created_at: string
          default_completion: number | null
          default_task_status_id: string | null
          duration_days: number | null
          effort_hours: number | null
          id: string
          name: string
          position: number
          process_type: string
          status: string
          take_retake_count: number
          take_retake_mode: string
          task_status_workflow_id: string | null
          updated_at: string
          workflow_id: string
        }
        Insert: {
          assignee_group_id?: string | null
          colour: string
          created_at?: string
          default_completion?: number | null
          default_task_status_id?: string | null
          duration_days?: number | null
          effort_hours?: number | null
          id?: string
          name: string
          position?: number
          process_type: string
          status?: string
          take_retake_count?: number
          take_retake_mode?: string
          task_status_workflow_id?: string | null
          updated_at?: string
          workflow_id: string
        }
        Update: {
          assignee_group_id?: string | null
          colour?: string
          created_at?: string
          default_completion?: number | null
          default_task_status_id?: string | null
          duration_days?: number | null
          effort_hours?: number | null
          id?: string
          name?: string
          position?: number
          process_type?: string
          status?: string
          take_retake_count?: number
          take_retake_mode?: string
          task_status_workflow_id?: string | null
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_processes_default_task_status_id_fkey"
            columns: ["default_task_status_id"]
            isOneToOne: false
            referencedRelation: "workflow_task_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_processes_task_status_workflow_id_fkey"
            columns: ["task_status_workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_processes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_task_statuses: {
        Row: {
          colour: string
          completion_percentage: number
          created_at: string
          id: string
          name: string
          position: number
          status: string
          status_code: string | null
          updated_at: string
          workflow_id: string
        }
        Insert: {
          colour: string
          completion_percentage?: number
          created_at?: string
          id?: string
          name: string
          position?: number
          status?: string
          status_code?: string | null
          updated_at?: string
          workflow_id: string
        }
        Update: {
          colour?: string
          completion_percentage?: number
          created_at?: string
          id?: string
          name?: string
          position?: number
          status?: string
          status_code?: string | null
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_task_statuses_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          colour: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
          status: string
          updated_at: string
          workflow_code: string
          workflow_type: string
        }
        Insert: {
          colour: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          workflow_code: string
          workflow_type: string
        }
        Update: {
          colour?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          workflow_code?: string
          workflow_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_workflow_tasks:
        | {
            Args: {
              p_entity_id: string
              p_entity_type: string
              p_workflow_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_entity_data?: Json
              p_entity_id: string
              p_entity_type: string
              p_parent_id?: string
              p_workflow_id: string
            }
            Returns: Json
          }
      get_or_create_board: {
        Args: { p_project_id?: string; p_scene_id?: string }
        Returns: string
      }
      is_active_user: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
