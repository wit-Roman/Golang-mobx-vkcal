import React from "react";
import { app_id } from "../constants";
import img_svg from "../img/logo.svg";
//import img_278x278 from '../img/278x278.png';
import img_index from "../img/index.png";
import img_index_mobile_dark from "../img/index-mobile-dark.png";
import img_settings from "../img/settings.png";
import img_widget from "../img/widget.png";

import { Link, Title, SimpleCell, Button, Div, Text } from "@vkontakte/vkui";
import Icon28ServicesOutline from "@vkontakte/icons/dist/28/services_outline";

const Promopage: React.FC<{ isMobile: boolean }> = ({ isMobile }) => (
	<Div>
		<SimpleCell
			title="Открыть страницу приложения"
			before={
				<Link target="_blank" href="https://vk.com/app7121023">
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
			Приложение позволяет посетителям сообщества записаться всего в один клик и мгновенно оценить текущее
			количество посещений в конкретный день по вашему ежедневному расписанию. Данные в приложении автообновляются
			реал-тайм, есть возможность вывести данные в виджет группы и автообновлять его.
		</Text>
		<Text weight="regular" className="welcome_text">
			Приложение помогает решить следующие задачи:
		</Text>
		<ul className="welcome_list">
			<li>Баланс (предотвращение) скоплений</li>
			<li>Организация записи посещений</li>
			<li>Распределение потока по дням</li>
			<li>Предотвращение дней простоя</li>
		</ul>

		<p
			className="open-screens-tab active"
			onClick={(e) => {
				e.currentTarget.classList.toggle("active");
			}}
		>
			<b>Описание и скриншоты (скрытый текст)</b>
		</p>
		<div className="welcome_images-wrap">
			<Text weight="regular" className="welcome_text">
				Может быть использовано группами по интересам, оказывающими услуги по установленному ежедневному
				расписанию. Например, арендаторы фитнес клубов нередко сталкиваются с проблемой, когда в пиковые дни все
				снаряды\корты заняты до предела, из-за чего возникает давка и очередь, а в другие - простаивают. Либо
				следить за посещаемостью лекций: 100% посещения необязательны, но кто-то из группы должен
				присутствовать.
			</Text>
			<Text weight="regular" className="welcome_text">
				Страница настроек доступна для пользователей с правами в группе и содержит следующие опции:
			</Text>
			<ul className="welcome_list">
				<li>
					"Время сервера" - "Time zone in Moscow (GMT+3)" - все даты ставятся относительно московского
					времени;
				</li>
				<li>
					"Разрешить запись только участникам сообщества" - только пользователи, нажавшие "Подписаться" в
					группе, смогут записываться;
				</li>
				<li>
					"Автоообновление записей каждые 8 секунд" - включает реалтайм синхронизацию с сервером
					использованием временных меток по Server Sent Events;
				</li>
				<li>
					"Публикация виджета в сообществе" - открывает предварительный просмотр виджета (дата/кол-во),
					размещает его на странице в группе, создает ключ и разрешает серверной части приложения создавать
					виджет на странице группы с автообновлением каждые 10 мин
				</li>
				<li>"Количество недель" - изменяет количество выводимых в виджете недель;</li>
				<li>
					"Ограничение по дням недели" - выставляет ограничения на выбор дат в календаре для пользователей по
					неделям;
				</li>
				<li>
					"Задать временной промежуток" - выставляет ограничения на выбор дат в календаре для пользователей от
					и до указанной даты;
				</li>
				<li>"Добавить нерабочие дни вручную" - выбранные даты будут недоступны для пользователей.</li>
			</ul>

			<div>
				<p>Главная:</p> <img src={img_index} alt="Скриншот Главная" />
			</div>
			<div>
				<p>Мобильные:</p>
				&nbsp;
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
				href={"https://vk.com/add_community_app?aid=" + app_id}
				onClick={(e) => {
					if (isMobile) {
						e.preventDefault();
						window.scrollTo(0, 0);
						return;
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
				V 0.7. Предложения по улучшению, вопросы, ошибки присылайте в сообщество:
				<Link target="_blank" href="https://vk.com/appwebxyz" alt="группа">
					vk.com/appwebxyz
				</Link>
			</Text>
		</Div>
	</Div>
);

export default React.memo(Promopage);
