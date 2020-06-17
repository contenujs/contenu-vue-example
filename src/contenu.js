/* eslint-disable */
import Vue from "vue";
class Contenu {
  data = {};
  props = {};
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    Vue.observable(this.data);
    this.fetchDataFromServer();
    this.initializeIframe();
    this.initializeMessageListener();
    return this;
  }
  fetchDataFromServer() {
    fetch(this.serverUrl + "/api/data")
      .then(response => response.json())
      .then(data => {
        this.setData(data);
      })
      .catch(error =>
        console.error("Contenu is unable to connect to server", error)
      );
  }
  initializeIframe() {
    this.contenuIframe = document.createElement("iframe");
    this.contenuIframe.setAttribute("id", "contenuWidget");
    this.contenuIframe.setAttribute(
      "style",
      "position:fixed; border:0; max-width:87px;max-height:96px; width:100%; top: 50px; right:0;height:80%; overflow: hidden;"
    );
    this.contenuIframe.setAttribute("src", this.serverUrl);
    document.getElementsByTagName("body")[0].appendChild(this.contenuIframe);
  }
  initializeMessageListener() {
    window.addEventListener(
      "message",
      event => {
        // if (event.origin !== this.serverUrl) return;

        let obj = this.data;

        switch (event.data.event) {
          case "init":
            this.contenuIframe.contentWindow.postMessage(
              {
                event: "init",
                envMode: process.env.NODE_ENV
              },
              "*"
            );
            break;
          case "iframeResize":
            if (event.data.value) {
              // make iframe big
              document.getElementById("contenuWidget").style.maxWidth = "300px";
              document.getElementById("contenuWidget").style.maxHeight =
                "unset";
            } else {
              //make iframe small
              setTimeout(() => {
                document.getElementById("contenuWidget").style.maxWidth =
                  "87px";
                document.getElementById("contenuWidget").style.maxHeight =
                  "96px";
              }, 500);
            }

            break;
          case "dataUpdate":
            var stack = event.data.path.split(".");
            while (stack.length > 1) {
              obj = obj[stack.shift()];
            }
            obj[stack.shift()] = event.data.data;
            break;
        }
      },
      false
    );
  }
  setData(obj) {
    let res = {};
    Vue.observable(res);
    for (let key in obj) {
      if (typeof obj[key] === "object") {
        // res[key] = this.setData(obj[key]);
        // if (this.data[key] !== "undefined") {
        this.data[key] = this.setData(obj[key]);
        // } else {
        // this.data[key] = Vue.set(res, key, obj[key]);
        // }
      } else {
        Vue.set(res, key, obj[key]);
      }
    }
    return res;
  }
  addToProp(prop) {
    Vue.set(this.data, prop, {});
    this.props[prop] = {};
  }
}
export default {
  install(Vue, options) {
    window.$contenu = new Contenu(options);
    Vue.prototype.$contenu = new Proxy(window.$contenu.data, {
      get(target, prop) {
        console.log(prop + " attempted");
        if (typeof window.$contenu.data[prop] === "undefined") {
          window.$contenu.addToProp(prop);
        }
        return window.$contenu.data[prop];
      }
    });
  }
};
