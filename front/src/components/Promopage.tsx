import React from 'react'
import { app_id } from '../constants'
import img_svg from '../img/logo.svg'
import img_index from '../img/index.png'
import img_index_mobile from '../img/index-mobile.png'
import img_index_mobile_dark from '../img/index-mobile-dark.png'
import img_settings from '../img/settings.png'
import img_widget from '../img/widget.png'

import { Link, Title, SimpleCell, Button, Div, Text } from '@vkontakte/vkui'
import Icon28ServicesOutline from '@vkontakte/icons/dist/28/services_outline'
import Icon16Link from '@vkontakte/icons/dist/16/link'

const Promopage: React.FC<{ isMobile: boolean }> = ({ isMobile }) => (
  <Div>
    <SimpleCell
      title="Открыть страницу приложения"
      className="mobileWrapLine"
      before={
        <Link target="_blank" href={'https://vk.com/app' + app_id}>
          <img className="welcome_logo" src={img_svg} alt="logo" />
        </Link>
      }
    >
      <Title level="1" weight="semibold" className="welcome_title">
        Приложение "Календарь посещений"
      </Title>
      <Title level="3" weight="medium" className="welcome_description">
        Оценивайте ожидаемую посещаемость внутри группы
      </Title>
    </SimpleCell>

    <Text weight="regular" className="welcome_text">
      Приложение дает возможность посетителям сообщества записаться всего в один
      клик и мгновенно оценить текущее количество посещений в конкретный день по
      вашему ежедневному расписанию. Вывод записей по дням обновляется
      реал-тайм, имеется вывод данных в автообновляемый виджет группы.
    </Text>
    <Text weight="regular" className="welcome_text">
      Приложение помогает решить следующие задачи:
      <ul className="welcome_list">
        <li>Баланс (предотвращение) скоплений</li>
        <li>Организация записи посещений</li>
        <li>Распределение потока по дням</li>
        <li>Предотвращение дней простоя</li>
      </ul>
    </Text>

    <p
      className="open-screens-tab active"
      onClick={(e) => {
        e.currentTarget.classList.toggle('active')
      }}
    >
      <b>Описание и скриншоты (скрытый текст)</b>
    </p>
    <div className="welcome_images-wrap">
      <Text weight="regular" className="welcome_text">
        Может использоваться заинтересованными группами, оказывающими услуги по
        установленному ежедневному расписанию. Например, арендаторы фитнес
        клубов нередко сталкиваются с проблемой, когда в пиковые дни все снаряды
        или корты заняты до предела, из-за чего возникает давка и очередь, а в
        другие - простаивают. Либо следить за посещаемостью лекций: 100%
        посещения необязательны, но кто-то из группы должен присутствовать.
      </Text>
      <Text weight="regular" className="welcome_text">
        Пользователь с правами на редакторование группы имеет доступ к странице
        настроек и возможность закреплять пользователей ко дням. Страница
        настроек содержит следующие опции:
        <ul className="welcome_list">
          <li>
            "Время сервера" - "Time zone in Moscow (GMT+3)" - все даты ставятся
            относительно московского времени;
          </li>
          <li>
            "Разрешить запись только участникам сообщества" - ограничение записи
            пользователей, только подписчики смогут записываться;
          </li>
          <li>
            "Ограничение по дням недели" - выставляет ограничение в календаре
            для пользователей на выбор дат по неделям;
          </li>
          <li>
            "Исключить временной период" - выставляет ограничение на выбор дат в
            календаре для пользователей от и до указанной даты;
          </li>
          <li>
            "Автопубликация виджета в сообществе" - открывает предварительный
            просмотр виджета (дата/кол-во), размещает его на странице в группе,
            создает ключ и разрешает серверной части приложения создавать виджет
            на странице группы с автообновлением каждые 10-15 мин
          </li>
          <li>
            "Добавить неактивные дни вручную" - выбранные даты будут недоступны
            для пользователей.
          </li>
          <li>
            "Редактирование дня" - опционально позволяет задать текст-описание и
            цвет фона дня в календаре
          </li>
          <li>
            "Сбросить все настройки" - вернуть ввсе настройки по умолчанию,
            удалить все заблокированные дни, удалить всех закрепленных
            пользователей
          </li>
        </ul>
      </Text>

      <div>
        <p>Главная:</p> <img src={img_index} alt="Скриншот Главная" />
      </div>
      <div>
        <p>Мобильные:</p>
        &nbsp;
        <img src={img_index_mobile} alt="Скриншот Мобильные" />
        <img src={img_index_mobile_dark} alt="Скриншот Мобильные Темная" />
      </div>
      <div>
        <p>Настройки:</p>
        &nbsp;
        <img src={img_settings} alt="Скриншот Настройки" />
      </div>
      <div>
        <p>Виджет (дата/кол-во):</p>
        &nbsp;
        <img src={img_widget} alt="Скриншот Виджет" />
      </div>
    </div>

    <Div>
      <Link
        target="_blank"
        href={'https://vk.com/add_community_app?aid=' + app_id}
        onClick={(e) => {
          if (isMobile) {
            e.preventDefault()
            window.scrollTo(0, 0)
            return
          }
        }}
      >
        <Button before={<Icon28ServicesOutline className="inline" />}>
          &nbsp;Установить приложение для сообщества
        </Button>
      </Link>
    </Div>
    <Div>
      <Text weight="regular">
        Версия 0.7.
        <br />
        <Link target="_blank" href="https://vk.com/appwebxyz" alt="группа">
          Страница сообщества <Icon16Link className="inline" />
        </Link>
      </Text>
    </Div>
  </Div>
)

export default React.memo(Promopage)
