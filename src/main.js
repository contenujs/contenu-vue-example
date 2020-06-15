/* eslint-disable */
import Vue from "vue";
import App from "./App.vue";

import Contenu from "./contenu";

Vue.config.productionTip = false;
Vue.use(Contenu, "http://localhost:4000");
new Vue({
  render: h => h(App)
}).$mount("#app");
