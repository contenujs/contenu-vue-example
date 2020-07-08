/* eslint-disable */
import Vue from "vue";
import App from "./App.vue";

import Contenu from "./contenu";

Vue.config.productionTip = false;
Vue.use(Contenu, {
  serverAddress: "http://localhost:4000",
  fetchDataAddress: "/api/data"
});
window.app = new Vue({
  render: h => h(App)
}).$mount("#app");
