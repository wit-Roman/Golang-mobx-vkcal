import React from "react";
import { inject } from "mobx-react";
import { observer } from "mobx-react-lite";

import View from "@vkontakte/vkui/dist/components/View/View";
import ScreenSpinner from "@vkontakte/vkui/dist/components/ScreenSpinner/ScreenSpinner";

import { Homepage, Calendar, Setting } from "./panels";
import { panels } from "./constants";
import { IAppStore } from "./store/storeTypes";

import "@vkontakte/vkui/dist/vkui.css";
import "./style.css";

interface IProps {
  appStore: IAppStore;
}

const App: React.FC<IProps> = ({
  appStore: { activePanel, isLoading, changePanel },
}) => (
  <View
    id="view"
    activePanel={activePanel}
    popout={isLoading && <ScreenSpinner size="large" />}
  >
    <Homepage id={panels.Homepage} handlePanel={changePanel} />
    <Calendar id={panels.Calendar} handlePanel={changePanel} />
    <Setting id={panels.Setting} handlePanel={changePanel} />
  </View>
);

export default inject("appStore")(
  observer(App)
) as unknown as React.ComponentType<Omit<IProps, "appStore">>;
