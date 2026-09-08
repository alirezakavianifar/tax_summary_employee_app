export interface MenuSettingItem {
  id: string;
  menuKey: string;
  parentKey: string | null;
  title: string;
  route: string;
  iconName: string | null;
  isVisible: boolean;
  adminOnly: boolean;
  allowedRoles: string[];
  displayOrder: number;
  description: string | null;
  children: MenuSettingItem[];
}

export interface UpdateMenuSettingItem {
  menuKey: string;
  isVisible: boolean;
  adminOnly: boolean;
  allowedRoles?: string[];
  displayOrder?: number;
}

export interface UpdateMenuSettingsPayload {
  settings: UpdateMenuSettingItem[];
}
