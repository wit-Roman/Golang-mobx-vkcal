import bridge from "@vkontakte/vk-bridge";
import { app_id, apiUrl, uri, getParameterByName, platforms, group_roles, versionVKApi } from "../constants";
import {
	IvkData,
	IIncomingData,
	IApi,
	IResultbackSendDate,
	IdataUsers,
	IdataUser,
	IcallbackAction,
	IpinnedDateResult,
	IResultbackSendSession,
	IgroupsUser,
	IgroupInfo,
	ISaveSetting,
	IResultSetting,
	IResultbackGetDates,
	ICountSelectedDates,
} from "./storeTypes";

export default class Api implements IApi {
	private backToken = "";
	private widgetToken = "";
	eventSource: EventSource | null = null;
	isEventSourceOpen = false;
	isMobile = false;
	isRedactorRights = false;
	isSubscriberRights = false;
	constructor(private vkData: IvkData) {}

	sseOpen(url: string, callbackAction: IcallbackAction) {
		if (!this.isEventSourceOpen && !!window.EventSource) {
			this.eventSource = new EventSource(url);
			this.isEventSourceOpen = true;

			this.eventSource.addEventListener("message", (e) => {
				e.data && this.listenMessage(JSON.parse(e.data), callbackAction);
			});
		}
	}

	sseClose() {
		this.eventSource?.close();
		this.eventSource = null;
		this.isEventSourceOpen = false;
	}

	listenMessage(incomingData: IIncomingData, callbackAction: IcallbackAction) {
		if (incomingData?.length !== 4 || incomingData[1] === this.vkData.query_parameters.viewer_id) return;

		callbackAction(incomingData);
	}
	//BRIDGE START
	bridgeInit() {
		bridge.send("VKWebAppInit");

		const iframeUrl = window.location.href;
		const query_parameters = {
			vk_app_id: +(getParameterByName("vk_app_id", iframeUrl) || 0),
			viewer_id: +(getParameterByName("vk_user_id", iframeUrl) || 0),
			vk_group_id: +(getParameterByName("vk_group_id", iframeUrl) || 0),
			vk_platform: getParameterByName("vk_platform", iframeUrl),
			group_role: getParameterByName("vk_viewer_group_role", iframeUrl),
		};
		const rights = group_roles.indexOf(query_parameters.group_role!) || 0;
		this.isRedactorRights = rights > 1;
		this.isSubscriberRights = rights > 0;

		this.vkData.query_parameters = {
			iframeUrl,
			...query_parameters,
			rights,
		};

		bridge.subscribe(({ detail: { type, data } }) => {
			/*api_host: "api.vk.com"
			scheme: "bright_light"
			viewport_height: 969
			viewport_width: 1040*/

			if (type === "VKWebAppUpdateConfig") {
				this.isMobile =
					query_parameters.vk_platform === platforms.mobile_web ||
					//@ts-ignore
					data.viewport_width < 480;
				const schemeAttribute = document.createAttribute("scheme");
				//@ts-ignore
				schemeAttribute.value = data.scheme ? data.scheme : "client_light";
				document.body.attributes.setNamedItem(schemeAttribute);
			}
		});
	}

	bridgeUserInfo() {
		return bridge
			.send("VKWebAppGetUserInfo")
			.then((result) => {
				this.vkData.fetchedUser = result;
				return Promise.resolve();
			})
			.catch((error) => {
				return Promise.reject(error);
			});
	}
	bridgeGroupInfo(group_id: number) {
		return bridge
			.send("VKWebAppGetGroupInfo", {
				group_id,
			})
			.then((result) => {
				this.vkData.fetchedGroup = result;
				return Promise.resolve();
			});
	}
	bridgeAuthToken() {
		return bridge
			.send("VKWebAppGetAuthToken", {
				scope: "groups",
				app_id,
			})
			.then((result) => {
				this.vkData.AuthToken = result.access_token;
				return Promise.resolve();
			});
	}
	bridgeAddToComm() {
		return bridge.send("VKWebAppAddToCommunity").then((result) => {
			return result.group_id ? result.group_id : Promise.reject();
		});
	}
	bridgeRequestGroups(groupList: number[]) {
		const { viewer_id } = this.vkData.query_parameters!;
		const { AuthToken } = this.vkData;
		if (!groupList.length || !viewer_id || !AuthToken) return Promise.reject();

		return bridge
			.send("VKWebAppCallAPIMethod", {
				method: "groups.getById",
				params: {
					group_ids: groupList.join(),
					v: versionVKApi,
					access_token: AuthToken,
					fields: "description, role",
				},
			})
			.then((result) => {
				return result.response ? (result.response as Promise<IgroupInfo[]>) : Promise.reject();
			})
			.catch((error) => {
				throw error;
			});
	}

	bridgeAddWidget(code: (group_id: number) => string) {
		const { vk_group_id } = this.vkData.query_parameters!;

		return bridge
			.send("VKWebAppGetCommunityToken", {
				app_id,
				group_id: vk_group_id,
				scope: "app_widget",
			})
			.then((result) => {
				if (!result.access_token) return Promise.resolve(false);
				this.widgetToken = result.access_token;
				return bridge
					.send("VKWebAppShowCommunityWidgetPreviewBox", {
						type: "table",
						group_id: vk_group_id,
						code: code(vk_group_id),
					})
					.then(() => Promise.resolve(true))
					.catch((error) => {
						console.error(error);
					});
			})
			.catch((error) => {
				console.error(error);
			}) as Promise<boolean>;
	}
	//BACKEND METHODS
	backSendSession() {
		if (!this.vkData.fetchedUser || !this.vkData.query_parameters?.iframeUrl) return Promise.reject();
		this.backToken = this.vkData.query_parameters.iframeUrl;

		const body = {
			first_name: this.vkData.fetchedUser.first_name,
			last_name: this.vkData.fetchedUser.last_name,
			photo_100: this.vkData.fetchedUser.photo_100,
			timezone: this.vkData.fetchedUser.timezone,
		};
		return this.ajaxMiddleware(apiUrl + uri.Session, "POST", body) as Promise<IResultbackSendSession>;
	}

	backGetUsersData() {
		const { vk_group_id, viewer_id } = this.vkData.query_parameters!;
		if (!vk_group_id || !viewer_id) return Promise.reject();

		return this.ajaxMiddleware(apiUrl + "/users?g=" + vk_group_id + "&v=" + viewer_id) as Promise<IdataUsers>;
	}

	backGetUserData(find_viewer_id: number) {
		const { vk_group_id, viewer_id } = this.vkData.query_parameters!;
		if (!vk_group_id || !viewer_id) return Promise.reject();

		return this.ajaxMiddleware(
			apiUrl + "/user?g=" + vk_group_id + "&v=" + viewer_id + "&fv=" + find_viewer_id
		) as Promise<IdataUser>;
	}

	backSendDate(date: number, isNew: boolean) {
		const { vk_group_id, viewer_id } = this.vkData.query_parameters!;
		if (!vk_group_id || !viewer_id) return Promise.reject();

		return this.ajaxMiddleware(
			apiUrl + "/change?g=" + vk_group_id + "&v=" + viewer_id + "&d=" + date + "&n=" + +isNew
		) as Promise<IResultbackSendDate>;
	}

	backStartListen(callbackAction: IcallbackAction) {
		const { vk_group_id, viewer_id } = this.vkData.query_parameters!;
		if (!vk_group_id || !viewer_id) return;

		this.sseOpen(
			apiUrl + uri.Listen + "?g=" + vk_group_id + "&v=" + viewer_id + "&t=" + encodeURIComponent(this.backToken),
			callbackAction
		);
	}

	backSendPinDate(date: number, find_viewer_id: number, isNew: boolean) {
		const { vk_group_id, viewer_id } = this.vkData.query_parameters;
		if (!vk_group_id || !viewer_id) return Promise.reject();

		const url =
			apiUrl +
			"/pinned?g=" +
			vk_group_id +
			"&v=" +
			viewer_id +
			"&fv=" +
			find_viewer_id +
			"&d=" +
			date +
			"&n=" +
			+isNew;
		return this.ajaxMiddleware(url) as Promise<IpinnedDateResult>;
	}

	backGetGroupsUser() {
		const { viewer_id } = this.vkData.query_parameters;
		if (!viewer_id) return Promise.reject();

		const url = apiUrl + "/groups?v=" + viewer_id;
		return this.ajaxMiddleware(url) as Promise<IgroupsUser>;
	}

	backGetSetting() {
		const { vk_group_id, viewer_id } = this.vkData.query_parameters;
		if (!vk_group_id || !viewer_id) return Promise.reject();

		const url = apiUrl + "/setting?g=" + vk_group_id + "&v=" + viewer_id;
		return this.ajaxMiddleware(url) as Promise<IResultSetting>;
	}

	backSaveSetting(setting: ISaveSetting) {
		const { vk_group_id, viewer_id } = this.vkData.query_parameters;
		if (!vk_group_id || !viewer_id) return Promise.reject();

		const url = apiUrl + "/savesetting?g=" + vk_group_id + "&v=" + viewer_id;
		return this.ajaxMiddleware(url, "POST", setting) as Promise<{
			IsSaveSetting: boolean;
		}>;
	}

	backDeleteSetting() {
		const { vk_group_id, viewer_id } = this.vkData.query_parameters;
		if (!vk_group_id || !viewer_id) return Promise.reject();

		const url = apiUrl + "/savesetting?reset=1&g=" + vk_group_id + "&v=" + viewer_id;
		return this.ajaxMiddleware(url) as Promise<{
			IsSaveSetting: boolean;
		}>;
	}

	backGetDates() {
		const { vk_group_id, viewer_id } = this.vkData.query_parameters;
		if (!vk_group_id || !viewer_id) return Promise.reject();

		const url = apiUrl + "/dates?g=" + vk_group_id + "&v=" + viewer_id;
		return this.ajaxMiddleware(url) as Promise<IResultbackGetDates>;
	}

	backEnableWidget() {
		const { vk_group_id, viewer_id } = this.vkData.query_parameters;
		const { widgetToken } = this;
		if (!vk_group_id || !viewer_id || !widgetToken) return Promise.reject();

		const body = {
			Token: widgetToken,
		};
		const url = apiUrl + "/widget?g=" + vk_group_id + "&v=" + viewer_id;
		return this.ajaxMiddleware(url, "POST", body) as Promise<{ Enabled: boolean }>;
	}

	backGetCountSelectedDates() {
		const { vk_group_id, viewer_id } = this.vkData.query_parameters;
		if (!vk_group_id || !viewer_id) return Promise.reject();

		const url = apiUrl + "/countdates?g=" + vk_group_id + "&v=" + viewer_id;
		return this.ajaxMiddleware(url) as Promise<ICountSelectedDates>;
	}

	ajaxMiddleware(url: string, method: "POST" | "GET" = "GET", body = {}) {
		console.log(url, body);
		const xhrOption: RequestInit = {
			method,
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + this.backToken,
			},
			body: method === "POST" ? JSON.stringify(body) : undefined,
		};

		return fetch(url, xhrOption)
			.then((response) => {
				if (!response.ok) return Promise.reject(response.statusText);

				if (response.headers.has("Authorization")) this.backToken = response.headers.get("Authorization")!;

				return response.json();
			})
			.catch((err) => {
				return Promise.reject(err);
				//throw err
			});
	}
}
