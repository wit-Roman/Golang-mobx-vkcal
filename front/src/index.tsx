import { render } from 'react-dom'
import { Provider } from 'mobx-react'
import { AdaptivityProvider, AppRoot } from '@vkontakte/vkui'
import MainStore from './store/MainStore'
import App from './App'

const mainStore = new MainStore()
mainStore.init()

render(
  <Provider
    appStore={mainStore.appStore}
    homeStore={mainStore.homeStore}
    calendarStore={mainStore.calendarStore}
    settingStore={mainStore.settingStore}
  >
    <AdaptivityProvider>
      <AppRoot>
        <App />
      </AppRoot>
    </AdaptivityProvider>
  </Provider>,
  document.getElementById('root'),
)

/*if (process.env.NODE_ENV === "development") {
	import("./eruda").then(({ default: eruda }) => {}); //runtime download
}*/
