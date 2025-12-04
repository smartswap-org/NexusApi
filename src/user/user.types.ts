export interface User {
    id: string;
    email: string;
    password_hash: string;
    status: 'active' | 'suspended' | 'deleted';
}
