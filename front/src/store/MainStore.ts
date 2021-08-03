import { observable, action } from 'mobx'
import Api from './Api'
import HomeStore from './HomeStore'
import CalendarStore from './CalendarStore'
import SettingStore from './SettingStore'
import { panels, vkDataEmpty } from '../constants'

import {
  IvkData,
  IMainStore,
  IAppStore,
  IdataUsers,
  ICalendarData,
} from './storeTypes'

export default class MainStore implements IMainStore {
  private api: Api
  appStore: IAppStore
  homeStore: HomeStore
  calendarStore: CalendarStore
  settingStore: SettingStore

  vkData: IvkData = vkDataEmpty
  usersData: IdataUsers = {}

  constructor() {
    this.api = new Api(this.vkData)
    this.appStore = new AppStore(this.loadData)
    this.homeStore = new HomeStore(this.vkData, this.api)
    this.calendarStore = new CalendarStore(this.api)
    this.settingStore = new SettingStore(this.api)
  }

  init = async () => {
    this.appStore.isLoading = true
    this.api.bridgeInit()
    const { viewer_id, vk_group_id } = this.vkData.query_parameters
    if (!viewer_id) {
      this.appStore.changePanel(panels.Homepage)
      this.appStore.isLoading = false
      return
    }

    try {
      await this.api.bridgeUserInfo()
      const { fetchedUser } = this.vkData
      if (!vk_group_id || !fetchedUser) {
        this.appStore.isLoading = false
        this.appStore.changePanel(panels.Homepage)
        return
      }
      await this.loadData()
    } catch (error) {
      throw error
    } finally {
      this.appStore.isLoading = false
    }
  }

  loadData = async () => {
    const result = await this.api.backSendSession()
    if (result) {
      const { id, photo_100 } = this.vkData.fetchedUser!
      const calendarData: ICalendarData = {
        ...result,
        currentUserViewer_id: id,
        currentUserPhoto_100: photo_100,
      }
      this.calendarStore.setData(calendarData)
    } else {
      this.appStore.changePanel(panels.Homepage)
    }
    return Promise.resolve()
  }
}

export class AppStore {
  @observable activePanel: panels = panels.Calendar
  @observable isLoading = false
  constructor(private loadData: () => void) {}

  @action.bound
  changePanel(panel: panels) {
    this.activePanel = panel
    if (panel === panels.Calendar) this.loadData()
  }
}
