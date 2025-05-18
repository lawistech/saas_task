export interface Project {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    status: 'active' | 'on_hold' | 'completed' | 'cancelled';
    start_date: string | null;
    end_date: string | null;
    client_name: string | null;
    client_email: string | null;
    budget: number | null;
    custom_fields?: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}
