import React, { useEffect } from 'react'
import { inject } from 'mobx-react'
import { observer } from 'mobx-react-lite'

import {
  Panel,
  PanelHeader,
  PanelHeaderButton,
  Button,
  Group,
  SimpleCell,
  InfoRow,
  List,
  Avatar,
  Link,
  Snackbar,
} from '@vkontakte/vkui'
import {
  Icon24Users,
  Icon28ListPlayOutline,
  Icon28CalendarOutline,
  Icon16Link,
  Icon28WarningTriangleOutline,
  Icon24Settings,
  Icon28RefreshOutline,
} from '@vkontakte/icons'

import Promopage from '../components/Promopage'
import { panels, genetive, app_id, vkAppPage } from '../constants'
import { IHomeStore, IgroupInfo } from '../store/storeTypes'

interface IProps {
  id: panels
  handlePanel(panel: panels): void
  homeStore: IHomeStore
}

const Homepage: React.FC<IProps> = (props) => {
  const {
    id,
    handlePanel,
    homeStore: {
      init,
      addToCommunity,
      loadGroupsInfo,
      clearSnackBarMessage,
      inGroup,
      showSetting,
      currentGroup_id,
      currentViewer_id,
      fetchedGroup,
      groupList,
      groupListInfo,
      snackBarMessage,
      newGroupLink,
      isMobile,
    },
  } = props

  useEffect(() => {
    init()
  }, [init])

  const PanelHeaderButtonLeft = (
    <PanelHeaderButton
      title="Перейти в календарь"
      onClick={() => {
        if (inGroup) handlePanel(panels.Calendar)
      }}
    >
      <Icon28CalendarOutline />
    </PanelHeaderButton>
  )

  const PanelHeaderButtonRight = showSetting ? (
    <Icon24Settings
      onClick={() => {
        handlePanel(panels.Setting)
      }}
    />
  ) : (
    <Avatar size={36} />
  )

  const installBadgeLink = newGroupLink ? (
    <Link
      href={newGroupLink}
      title="Перейти"
      target="_blank"
      rel="noopener noreferrer"
    >
      Перейти в установленную группу
      <Icon16Link className="inline" />
    </Link>
  ) : null

  return (
    <Panel id={id}>
      <PanelHeader left={PanelHeaderButtonLeft} right={PanelHeaderButtonRight}>
        Установка и описание
      </PanelHeader>

      {showSetting && (
        <Group title="Панель настройки">
          <SimpleCell expandable>
            <Button
              size="l"
              mode="primary"
              onClick={() => {
                handlePanel(panels.Setting)
              }}
              before={<Icon24Settings />}
            >
              Настройки
            </Button>
          </SimpleCell>
        </Group>
      )}
      <Group>
        <SimpleCell expandable={inGroup}>
          <InfoRow header="Текущая группа: ">
            {inGroup ? (
              <Link
                className="row homepage_current_group"
                href={vkAppPage + app_id + '_-' + currentGroup_id}
                title={fetchedGroup.name}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Avatar
                  className="inline"
                  src={fetchedGroup.photo_100}
                  alt={fetchedGroup.name}
                  size={24}
                />
                &nbsp;{currentGroup_id}&nbsp;:&nbsp;{fetchedGroup.name}
                <Icon16Link className="inline" />
              </Link>
            ) : (
              'не выбрана'
            )}
          </InfoRow>
        </SimpleCell>
        <SimpleCell badge={installBadgeLink}>
          <Button
            size="l"
            mode="primary"
            onClick={addToCommunity}
            before={<Icon24Users />}
            disabled={!currentViewer_id}
          >
            {inGroup
              ? 'Установить в другую группу'
              : 'Установить приложение в группу'}
          </Button>
        </SimpleCell>
      </Group>
      {groupList.length ? (
        <Group>
          <SimpleCell>
            <InfoRow
              header={`Запись осуществлялась в ${
                groupList.length
              } групп${genetive(groupList.length)}:`}
            >
              <Button
                size="l"
                mode="primary"
                disabled={!currentViewer_id}
                onClick={loadGroupsInfo}
                before={<Icon28ListPlayOutline />}
              >
                Загрузить список посещенных групп
              </Button>
            </InfoRow>
          </SimpleCell>
          <GroupListInfo
            groupListInfo={groupListInfo}
            currentGroup_id={currentGroup_id}
          />
        </Group>
      ) : null}
      <Group title="Описание">
        <Promopage isMobile={isMobile} />
      </Group>
      {!!snackBarMessage && (
        <Snackbar
          before={<Icon28WarningTriangleOutline />}
          after={
            <Icon28RefreshOutline
              className="snackBar_update"
              onClick={() => window.location.reload()}
            />
          }
          onClose={clearSnackBarMessage}
          onActionClick={clearSnackBarMessage}
        >
          {snackBarMessage}
        </Snackbar>
      )}
    </Panel>
  )
}

const GroupListInfo: React.FC<{
  groupListInfo: IgroupInfo[]
  currentGroup_id: number
}> = (props) => {
  const { groupListInfo, currentGroup_id } = props
  if (!groupListInfo.length) return null
  return (
    <List>
      {groupListInfo.map((group, index) => (
        <SimpleCell key={index} expandable onClick={() => {}}>
          <InfoRow
            header={`${group.screen_name}
              ${group.is_admin ? ', Роль: Администратор' : ''}
              ${group.is_closed ? ', Закрытая' : ''} 
              ${currentGroup_id === group.id ? ', Текущая группа' : ''}
            `}
          >
            <Link
              className="row homepage_current_group"
              target="_blank"
              href={vkAppPage + app_id + '_-' + group.id}
              alt="Открыть страницу группы"
            >
              <Avatar
                className="inline"
                src={group.photo_100}
                alt={group.name}
                size={24}
              />
              &nbsp;{group.id}&nbsp;:&nbsp;{group.name}
              <Icon16Link className="inline" />
            </Link>
            {group.description && ', описание:' + group.description}
          </InfoRow>
        </SimpleCell>
      ))}
    </List>
  )
}

export default (inject('homeStore')(
  observer(Homepage),
) as unknown) as React.ComponentType<Omit<IProps, 'homeStore'>>
