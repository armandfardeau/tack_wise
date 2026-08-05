export const USER_ID_COOKIE_NAME = 'tack_wise_user_id';

export interface UserEntity {
  id: string;
}

export interface FeatureFlagEntities {
  user?: UserEntity;
}
