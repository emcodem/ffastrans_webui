class UserFacingApiError extends Error {
  constructor() {
    super(...arguments);
    this.name = 'UserFacingApiError';
  }
}
export default UserFacingApiError;