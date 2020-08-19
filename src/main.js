/* eslint-disable */
import Vue from "vue";
import App from "./App.vue";
require("./assets/app.css");
import Contenu from "./contenu";

Vue.config.productionTip = false;
Vue.use(Contenu, {
  serverAddress: "http://localhost:8080",
  fetchDataAddress: "/api/data"
});
window.app = new Vue({
  render: h => h(App)
}).$mount("#app");
