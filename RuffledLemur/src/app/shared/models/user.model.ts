export interface User {
  id?: number;
  username: string;
  email: string;
  active: boolean;
  roles: string[];
  apiKeys?: string;
  department?: string;
  title?: string;

}
