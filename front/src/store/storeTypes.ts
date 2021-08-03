import { UserInfo, GroupInfo } from '@vkontakte/vk-bridge'
import { panels } from '../constants'
//main
export interface Iquery_parameters {
  iframeUrl: string
  vk_app_id: number
  viewer_id: number
  vk_group_id: number
  vk_platform: string | null
  group_role: string | null
  rights: number
}

export interface IvkData {
  fetchedUser?: UserInfo
  fetchedGroup?: GroupInfo
  query_parameters: Iquery_parameters
  AuthToken: string
}

export interface IMainStore {
  appStore: IAppStore
  homeStore: IHomeStore
  calendarStore: ICalendarStore
  settingStore: ISettingStore
  calendarData?: ICalendarData
  vkData: IvkData
}

export interface IAppStore {
  activePanel: panels
  isLoading: boolean
  changePanel(panel: panels): void
}
//api
export interface IApi {
  isMobile: boolean
  isRedactorRights: boolean
  isSubscriberRights: boolean
  bridgeInit(): void
  bridgeUserInfo(): Promise<void>
  bridgeGroupInfo(group_id: number): Promise<void>
  bridgeAuthToken(): Promise<void>
  bridgeRequestGroups(groupList: number[]): Promise<IgroupInfo[]>
  bridgeAddToComm(): Promise<number>
  bridgeAddWidget(code: (group_id: number) => string): Promise<boolean>

  backSendSession(): Promise<IResultbackSendSession>
  backSendDate(date: number, isNew: boolean): Promise<IResultbackSendDate>
  backStartListen(callbackAction: IcallbackAction): void
  backGetUsersData(): Promise<IdataUsers>
  backGetUserData(viewer_id: number): Promise<IdataUser>
  backSendPinDate(date: number, viewer_id: number, isNew: boolean): Promise<any>
  backGetGroupsUser(): Promise<IgroupsUser>
  backGetSetting(): Promise<IResultSetting>
  backSaveSetting(setting: ISaveSetting): Promise<{ IsSaveSetting: boolean }>
  backDeleteSetting(): Promise<{ IsSaveSetting: boolean }>
  backGetDates(): Promise<IResultbackGetDates>
  backEnableWidget(): Promise<{ Enabled: boolean }>
  backGetCountSelectedDates(): Promise<ICountSelectedDates>
}
//calendar
export interface ICalendarStore {
  currentUserPhoto_100: string
  dataUserSelectedDates: number[]

  detailedUsersInfoData: IUserDetailData[]
  detailedInfoData?: string
  isRedactorRights: boolean
  isMobile: boolean
  isSmallIcon: boolean

  currentCells: ICurrentCell[][]
  currentMonthTitle: string
  snackBarMessage: string

  init(): void
  dispose(): void
  nextMonth(): void
  prevMonth(): void
  select(item: ICurrentCell): void
  setData(data: ICalendarData): void
  openDetailedUsersInfo(data: number): void
  closeDetailedUsersInfo(): void
  pinViewerDate(date: number, viewer_id: number, isNew: boolean): void
  clearSnackBarMessage(): void
}

export interface ICurrentCell {
  cacheDay: number
  displayDay: string
  description: string
  color: string
  displayUsers?: {
    First_name: string
    Last_name: string
    Photo_100: string
    viewer_id: number
    IsPinned?: boolean
  }[]
  isSelected: boolean
  isToday: boolean
  isCurrentMonth: boolean
  isInnactive: boolean
}

export interface IdataUsers {
  [K: number]: IdataUser
}
export interface IdataUser {
  First_name: string
  Last_name: string
  Photo_100: string
  IsPinned?: boolean
}
export interface IUserDetailData extends IdataUser {
  IsPinned: boolean
  viewer_id: number
  date: number
}

export type IcallbackAction = (incomingData: IIncomingData) => void
export type IIncomingData = [number, number, number, number]

export interface IResultbackSendSession extends IResultSetting {
  CurrentDateNow: number
  DataUsers: IdataUsers
  DataUsersSelectedDates: IdataUsersSelectedDates
  DataUserSelectedDates: number[]
  DataUsersPinnedDates: IdataUsersPinnedDates
}

export interface IResultbackGetDates {
  DataUsersSelectedDates: IdataUsersSelectedDates
  DataUserSelectedDates: number[]
  DataUsersPinnedDates: IdataUsersPinnedDates
}

export interface IdataUsersSelectedDates {
  [K: number]: number[]
}

export interface IResultbackSendDate {
  IsWriting: boolean
  CurrentDateNow: number
  Viewer_id: number
}

export interface ICalendarData extends IResultbackSendSession {
  currentUserViewer_id: number
  currentUserPhoto_100: string
}

export interface IdataUsersPinnedDates {
  [K: number]: number[]
}
export interface IpinnedDateResult {
  IsPinned: number
  CurrentDateNow: number
  Viewer_id: number
}
//home
export interface IHomeStore {
  init(): void
  addToCommunity(): void
  loadGroupsList(): void
  loadGroupsInfo(): void
  clearSnackBarMessage(): void
  inGroup: boolean
  isMobile: boolean
  showSetting: boolean
  currentGroup_id: number
  currentViewer_id: number
  fetchedGroup: {
    name: string
    photo_100: string
  }
  groupList: number[]
  groupListInfo: IgroupInfo[]
  snackBarMessage: string
  newGroupLink: string
}

export interface IgroupsUser {
  Group_ids: number[]
}
export interface IgroupInfo {
  admin_level: number
  description: string
  id: number
  is_admin: 1 | 0
  is_advertiser: 1 | 0
  is_closed: 1 | 0
  is_member: 1 | 0
  name: 'тест8402'
  photo_100: 'https://vk.com/images/community_100.png'
  screen_name: 'club181462312'
}
//setting
export interface ISettingStore {
  displayServerDate: string
  displayBlockedPeriod: [string, string]
  displayMinStartBlockedPeriod: string | undefined
  displayMaxStartBlockedPeriod: string | undefined
  displayMaxEndBlockedPeriod: string | undefined
  displayMinEndBlockedPeriod: string | undefined
  currentMonthTitle: string
  snackBarMessage: string
  isMobile: boolean
  isSmallIcon: boolean
  settingCells: ISettingCell[][]
  dataBlockedDays: number[]
  dataAllowedWeekDays: boolean[]
  dataBlockedPeriod: [number, number]
  dataAccessMember: boolean
  dataWidgetEnable: boolean
  dataSpecialDays: IdataSpecialDays
  detailedCellSettingOpened: boolean
  detailedCellSettingDay?: ISettingCell

  init(): void
  nextMonth(): void
  prevMonth(): void
  clearSnackBarMessage(): void
  selectBlocked(day: ISettingCell): void
  changeAccessMember(): void
  changeAllowedWeekDays(index: number, isChecked: boolean): void
  changeBlockedPeriod(index: number, value: string | number): void
  save(): void
  resetSetting(): void
  openDetailedCellSetting(day: ISettingCell): void
  closeDetailedCellSetting(): void
  clearDetailedCellSettingDescription(): void
  clearDetailedCellSettingColor(): void
  changeDetailedCellSettingDescription(description: string): void
  changeDetailedCellSettingColor(color: string): void
  saveDetailedCellSetting(): void
  deleteDetailedCellSetting(): void
  addWidget(check: boolean): void
}
export interface ISettingCell {
  cacheDay: number
  displayDay: string
  isBlocked: boolean
  isToday: boolean
  isCurrentMonth: boolean
  isInnactive: boolean
  Description: string
  Color: string
}

export interface IResultSetting {
  SettingBlockedDays: number[]
  SettingAllowedWeekDays: boolean[]
  SettingBlockedPeriod: [number, number]
  SettingAccessMember: boolean
  SettingWidgetEnable: boolean
  SettingSpecialDays: IdataSpecialDays
  CurrentDateNow: number
}

export interface IdataSpecialDays {
  [K: number]: { Description: string; Color: string }
}

export interface ISaveSetting {
  AccessMember: boolean
  AllowedWeekDays: boolean[]
  BlockedPeriod: [number, number]
  WidgetEnable: boolean
  BlockedDays: number[]
}

export interface ICountSelectedDates {
  [K: number]: number
}
