/* eslint-disable */
import Vue from "vue";
import App from "./App.vue";
require("./assets/app.css");
import Contenu from "vue-contenu";
import VueRouter from "vue-router";
Vue.config.productionTip = false;
Vue.use(VueRouter);

const routes = [
  { path: "/", component: require("./index.vue").default },
  { path: "/about", component: require("./about.vue").default }
];

const router = new VueRouter({
  mode: "history",
  routes
});

Vue.use(Contenu, {
  serverAddress: "http://localhost:8080",
  fetchDataAddress: "/api/data",
  router
});
window.app = new Vue({
  render: h => h(App),
  router
}).$mount("#app");
