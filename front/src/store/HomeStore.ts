import { observable, action, runInAction } from 'mobx'

import { IvkData, IApi, IHomeStore, IgroupInfo } from './storeTypes'
import { app_id, vkAppPage } from '../constants'

export default class HomeStore implements IHomeStore {
  @observable inGroup = false
  private hasToken = false
  showSetting = false
  currentGroup_id = 0
  @observable currentViewer_id = 0
  isMobile = false
  fetchedGroup = {
    name: '',
    photo_100: '',
  }
  @observable.ref groupList: number[] = []
  @observable.ref groupListInfo: IgroupInfo[] = []
  @observable snackBarMessage = ''
  @observable newGroupLink = ''

  constructor(private vkData: IvkData, private api: IApi) {}

  @action.bound
  init() {
    const { viewer_id, vk_group_id } = this.vkData.query_parameters
    if (!viewer_id) return
    this.currentViewer_id = viewer_id
    this.loadGroupsList()

    if (!vk_group_id) return
    this.currentGroup_id = vk_group_id
    this.api.bridgeGroupInfo(vk_group_id).then(() => {
      runInAction(() => {
        this.inGroup = !!this.currentGroup_id && !!this.vkData.fetchedGroup

        if (!this.vkData.fetchedGroup) return
        const { name, photo_100 } = this.vkData.fetchedGroup
        this.fetchedGroup = {
          name,
          photo_100,
        }
      })
    })

    this.hasToken = !!this.vkData.AuthToken
    this.isMobile = this.api.isMobile
    this.showSetting = this.vkData.query_parameters.rights > 1
  }

  loadGroupsList = async () => {
    const result_groups = await this.api.backGetGroupsUser()

    if (!result_groups) return
    runInAction(() => {
      this.groupList = result_groups.Group_ids
    })
  }
  loadGroupsInfo = async () => {
    try {
      await this.loadGroupsList()
      if (!this.groupList.length) return

      if (!this.hasToken) await this.api.bridgeAuthToken()

      if (!this.vkData.AuthToken) return
      this.hasToken = !!this.vkData.AuthToken

      const result = await this.api.bridgeRequestGroups(this.groupList)
      runInAction(() => {
        this.groupListInfo = result
      })
    } catch (error) {
      runInAction(() => {
        this.snackBarMessage = 'Ошибка запроса'
      })
      throw error
    }
  }

  addToCommunity = async () => {
    if (!this.currentViewer_id) {
      window.location.href = vkAppPage + app_id //TODO web-версия
      return
    }

    try {
      if (!this.hasToken) await this.api.bridgeAuthToken()
      const group_id = await this.api.bridgeAddToComm()

      runInAction(() => {
        this.snackBarMessage = 'Успешно установлено'
        this.newGroupLink = vkAppPage + app_id + '_-' + group_id
      })
    } catch (error) {
      runInAction(() => {
        this.snackBarMessage = 'Ошибка запроса'
      })
      throw error
    }
  }

  @action.bound
  clearSnackBarMessage() {
    this.snackBarMessage = ''
  }
}
