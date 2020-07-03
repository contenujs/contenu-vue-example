/* eslint-disable */
import Vue from "vue";

class EventHandler {
  init = false;
  eventQueue = [];
  initializeMessageListener() {
    window.addEventListener(
      "message",
      event => {
        this.handler(event);
      },
      false
    );
  }
  sendMessage(data) {
    IFrameInitializer.contenuIframe.contentWindow.postMessage(data, "*");
  }
  handler(event) {
    if (event.data) {
      switch (event.data.type) {
        case "init":
          this.init = true;
          this.sendMessage({
            type: "init",
            envMode: process.env.NODE_ENV
          });
          IFrameInitializer.contenuIframe.style.width = "100%";
          break;
        case "newFields":
          this.requestNewFields();
          break;
        case "cssRules":
          if (event.data.value) {
            // make iframe big
            for (let key in event.data.value) {
              IFrameInitializer.contenuIframe.style[key] =
                event.data.value[key];
            }
          }

          break;
        case "dataUpdate":
          let obj = Contenu.data;
          var stack = event.data.path.split(".");
          while (stack.length > 1) {
            obj = obj[stack.shift()];
          }
          obj[stack.shift()] = event.data.data;
          break;
      }
    }
  }
  requestNewFields(objPath = null) {
    if (objPath != null)
      this.eventQueue.push({
        type: "newField",
        data: objPath
      });
    if (this.init) {
      this.eventQueue = this.eventQueue.reverse();
      for (let i in this.eventQueue) {
        this.sendMessage(this.eventQueue[i]);
      }
      this.eventQueue = [];
    }
  }
}
class Parser {
  static parse(obj1, props, result, parentKey = "") {
    for (let key in obj1) {
      if (typeof obj1[key] === "object") {
        props[key] = {};
        if (typeof result[key] == "undefined") result[key] = {};
        result[key]["__path"] = (parentKey.length ? parentKey + "." : "") + key;
        result[key] = Parser.parse(
          obj1[key],
          props[key],
          result[key],
          result[key]["__path"]
        );
      } else {
        Vue.set(result, key, obj1[key]);
      }
    }
    return result;
  }

  static compare(obj1, obj2) {
    let unknownPaths = {};
    for (let key in obj1) {
      if (typeof obj2[key] === "undefined") {
        unknownPaths[key] = obj1[key];
      } else if (
        typeof obj2[key] === "object" &&
        typeof obj1[key] === "object"
      ) {
        let unknownInnerPaths = Parser.compare(obj1[key], obj2[key]);
        if (Object.keys(unknownInnerPaths).length > 0)
          unknownPaths[key] = unknownInnerPaths;
      } else {
        unknownPaths[key] = obj1[key];
      }
    }

    return unknownPaths;
  }
}

class IFrameInitializer {
  static contenuIframe = null;
  constructor(serverUrl) {
    IFrameInitializer.contenuIframe = document.createElement("iframe");
    IFrameInitializer.contenuIframe.setAttribute("id", "contenuWidget");
    IFrameInitializer.contenuIframe.setAttribute(
      "style",
      [
        "position:fixed",
        "border:0",
        "width:0",
        "height:0",
        "overflow: hidden"
      ].join(";")
    );
    IFrameInitializer.contenuIframe.setAttribute("src", serverUrl);
  }
  mount(doc) {
    doc.appendChild(IFrameInitializer.contenuIframe);
  }
}

class Contenu {
  static data = {};
  props = {};
  loaded = false;
  iFrame = null;
  handler = null;
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    Vue.observable(Contenu.data);
    this.handler = new EventHandler();
    this.handler.initializeMessageListener();
    this.fetchDataFromServer();
    this.initIFrame();
    return this;
  }
  initIFrame() {
    this.iFrame = new IFrameInitializer(this.serverUrl);
    this.iFrame.mount(document.getElementsByTagName("body")[0]);
  }
  fetchDataFromServer() {
    fetch(this.serverUrl + "/api/data")
      .then(response => response.json())
      .then(res => {
        Parser.parse(res, this.props, Contenu.data);

        setTimeout(() => {
          this.handler.requestNewFields(Parser.compare(this.props, res));
        }, 5000);

        this.loaded = true;
      })
      .catch(error =>
        console.error("Contenu is unable to connect to server", error)
      );
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
          delete target.__value;
          Vue.set(target, prop, {
            __value: target[prop],
            __path: target.__path + "." + prop,
            parse: () => {
              return target[prop].__value ? target[prop].__value : target[prop];
            }
          });
        } else {
          if (typeof props[prop] === "undefined") {
            // console.log("new Prop", target.__path + "." + prop);
            props[prop] = {};
            delete target.__value;
          }
          Vue.set(target, prop, {
            __value: "",
            __path: target.__path + "." + prop,
            parse: () => {
              return target[prop].__value ? target[prop].__value : target[prop];
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

    Vue.prototype.$contenu = makeProxy(Contenu.data, window.$contenu.props);
  }
};
