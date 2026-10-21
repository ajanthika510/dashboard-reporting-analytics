
export interface AuthenticatedUser {
  userId: string;
  name: string;
  email: string;
  role: string;
  branchId?: string | null;
}
