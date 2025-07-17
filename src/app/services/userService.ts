import storageService, { StorageKey } from './storageService';
import appService from './appService';
import notifyService from './notifyService';

class UserService {
  private h_debug = false;

  private m_isLogin = false;
  private m_user: any = null;
  private m_unit: any = null;
  private m_roles: any[] = [];
  private m_avatar = '';

  constructor(
    // private storage: typeof storageService,
    // private app: typeof appService,
    // private notify: typeof notifyService,
  ) { }

  public async loadCache() {
    this.m_user = await storageService.get(StorageKey.USER, 'object');
    this.m_unit = await storageService.get(StorageKey.UNIT, 'object');
    this.m_roles = await storageService.get(StorageKey.ROLES, 'object');
    this.m_avatar = (await storageService.get(StorageKey.AVATAR)) || '';

    appService.log('[user.service] loadCache', {
      m_user: this.m_user,
      m_unit: this.m_unit,
      m_roles: this.m_roles,
      m_avatar: this.m_avatar,
    }, this.h_debug);
  }

  public async cleanCache() {
    await Promise.all([
      storageService.remove(StorageKey.USER),
      storageService.remove(StorageKey.UNIT),
      storageService.remove(StorageKey.ROLES),
      storageService.remove(StorageKey.AVATAR),
    ]);
  }

  public async logout() {
    await notifyService.unregister();

    await Promise.all([
      storageService.remove(StorageKey.USER),
      storageService.remove(StorageKey.UNIT),
      storageService.remove(StorageKey.ROLES),
      storageService.remove(StorageKey.TOKEN_BE),
      storageService.remove(StorageKey.TOKEN_FS),
    ]);

    this.m_isLogin = false;

    await appService.go('/login');
  }

  // User Info
  public setUser(user: any, isSave = false) {
    this.m_user = user;
    if (isSave) storageService.set(StorageKey.USER, user);
  }
  public getUser() {
    return this.m_user;
  }
  public getUserId(): number {
    return this.m_user?.id ?? -1;
  }
  public getUserUUID(): string {
    return this.m_user?.userId ?? '';
  }
  public getUserName(): string {
    return this.m_user?.userName ?? '';
  }
  public getFullName(): string {
    return this.m_user?.fullName ?? '';
  }
  public getEmail(): string {
    return this.m_user?.emailAddress ?? '';
  }

  // Unit
  public setUnit(unit: any) {
    this.m_unit = unit;
    storageService.set(StorageKey.UNIT, unit);
  }
  public getUnit() {
    return this.m_unit;
  }

  // Roles
  public setRoles(roles: any[], isSave = false) {
    this.m_roles = roles;
    if (isSave) storageService.set(StorageKey.ROLES, roles);
  }
  public getRoles() {
    return this.m_roles;
  }
  public getRoleByIndex(index: number) {
    if (index >= 0 && index < this.m_roles.length) return this.m_roles[index];
    return null;
  }
  public getRoleByCode(code: string) {
    return this.m_roles.find(role => role.Code === code) ?? null;
  }
  public getListRoleCode(): string[] {
    return this.m_roles.map(r => r.Code);
  }
  public hasRoleCode(roleCode: string): boolean {
    return this.m_roles.some(role => role.Code === roleCode);
  }

  // Login State
  public isLogin() {
    return this.m_isLogin;
  }
  public setIsLogin(value: boolean) {
    this.m_isLogin = value;
  }

  // Avatar
  public getAvatar() {
    return this.m_avatar;
  }
  public setAvatar(avatar: string, isSave = false) {
    this.m_avatar = avatar;
    if (isSave) storageService.set(StorageKey.AVATAR, avatar);
  }

  // Set by Register
  public setUserIdSimple(id: number) {
    if (!this.m_user) this.m_user = {};
    this.m_user.id = id;
  }
}

const userService = new UserService();
export default userService;
