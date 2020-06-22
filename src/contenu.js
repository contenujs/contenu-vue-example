/* eslint-disable */
import Vue from "vue";
class Contenu {
  data = {};
  props = {};
  loaded = false;
  eventQueue = [];
  init = false;
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
        this.loaded = true;
        this.setData(data, this.props, this.data);
        this.requestForNewFields(this.compare(this.props, this.data));
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
        if (event.data) {
          switch (event.data.event) {
            case "init":
              this.init = true;
              this.contenuIframe.contentWindow.postMessage(
                {
                  event: "init",
                  envMode: process.env.NODE_ENV
                },
                "*"
              );
              break;
            case "newFields":
              this.requestForNewFields();
              break;
            case "iframeResize":
              if (event.data.value) {
                // make iframe big
                document.getElementById("contenuWidget").style.maxWidth =
                  "300px";
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
        }
      },
      false
    );
  }
  setData(obj, props, res) {
    for (let key in obj) {
      if (typeof obj[key] === "object") {
        props[key] = {};
        res[key] = this.setData(obj[key], props[key], res[key]);
        res[key]["__path"] = key;
      } else {
        Vue.set(res, key, obj[key]);
      }
    }
    return res;
  }
  compare(obj1, obj2) {
    //console.log(obj1, obj2);
    let unknownPaths = {};
    for (let key in obj1) {
      if (typeof obj2[key] === "undefined") {
        unknownPaths[key] = obj1[key];
      } else if (
        typeof obj2[key] === "object" &&
        typeof obj1[key] === "object"
      ) {
        let unknownInnerPaths = this.compare(obj1[key], obj2[key]);
        if (Object.keys(unknownInnerPaths).length > 0)
          unknownPaths[key] = unknownInnerPaths;
      }
    }
    return unknownPaths;
  }
  requestForNewFields(objPath) {
    if (this.init == false) {
      this.eventQueue = {
        event: "newField",
        data: objPath
      };
    } else {
      if (Object.keys(this.eventQueue).length > 0) {
        this.contenuIframe.contentWindow.postMessage(this.eventQueue, "*");
        this.eventQueue = {};
      }
      if (typeof objPath !== "undefined")
        this.contenuIframe.contentWindow.postMessage(this.eventQueue, "*");
    }
  }
}
let makeProxy = (data, props) => {
  return new Proxy(data, {
    get: (target, prop) => {
      if (typeof props === "undefined") props = {};
      if (typeof target.__path === "undefined") {
        target.__path = "";
      }
      try {
        if (
          typeof props[prop] === "undefined" &&
          typeof target[prop] == "object"
        ) {
          // console.log("new Prop", target.__path + "." + prop);
          props[prop] = {};
        }
        return makeProxy(target[prop], props[prop]);
      } catch (err) {
        if (prop === "__value") {
          if (typeof target.__value !== "undefined") return target.__value;
          if (typeof target === "object" && Object.keys(target).length == 0)
            return null;
          return target;
        }
        if (typeof target[prop] === "string") {
          Vue.set(target, prop, {
            __value: target[prop],
            __path: target.__path + "." + prop,
            parse: () => {
              return target[prop].__value;
            }
          });
        } else {
          if (typeof props[prop] === "undefined") {
            // console.log("new Prop", target.__path + "." + prop);
            props[prop] = {};
          }
          Vue.set(target, prop, {
            __value: "",
            __path: target.__path + "." + prop,
            parse: () => {
              return target[prop].__value;
            }
          });
        }
        return makeProxy(target[prop], props[prop]);
      }
    }
  });
};

export default {
  install(Vue, options) {
    window.$contenu = new Contenu(options);

    Vue.prototype.$contenu = makeProxy(
      window.$contenu.data,
      window.$contenu.props
    );
  }
};
