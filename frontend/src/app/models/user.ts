export interface User {
    id: number;
    name: string;
    email: string;
    bio?: string | null;
    phone?: string | null;
    address?: string | null;
    profile_picture?: string | null;
    email_verified_at?: string | null;
    created_at: string;
    updated_at: string;
}
