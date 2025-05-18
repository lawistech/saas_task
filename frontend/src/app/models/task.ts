export interface Task {
    id: number;
    user_id: number;
    project_id?: number | null;
    title: string;
    description: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    group?: string | null;
    stage?: string | null;
    priority: 'low' | 'medium' | 'high';
    due_date: string | null;
    created_at: string;
    updated_at: string;
    assignee_id?: number | null;
    phone?: string | null;
    country_code?: string | null;
    custom_fields?: Record<string, any> | null;
    assignee?: {
        id: number;
        name: string;
        email: string;
        profile_picture?: string | null;
    } | null;
    project?: {
        id: number;
        name: string;
    } | null;
}
