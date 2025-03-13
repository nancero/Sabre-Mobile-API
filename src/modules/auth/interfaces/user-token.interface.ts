import { IUser } from '../../users/interfaces/user.interface';

export interface UserWithToken {
  user: IUser;
  accessToken: string;
}
