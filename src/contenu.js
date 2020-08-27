/* eslint-disable */

class EventHandler {
  init = false;
  newFieldRequested = false;
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
          this.newFieldRequested = true;
          this.requestNewFields(Parser.compare(Contenu.props, Contenu.res));
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
        set(result, key, obj1[key]);
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
  constructor(serverUrl, key) {
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
    IFrameInitializer.contenuIframe.setAttribute(
      "src",
      serverUrl + "?key=" + key
    );
  }
  mount(doc) {
    doc.appendChild(IFrameInitializer.contenuIframe);
  }
  remove() {
    IFrameInitializer.contenuIframe.parentNode.removeChild(
      IFrameInitializer.contenuIframe
    );
  }
}

class Contenu {
  static data = {};
  static props = {};
  static res = {};
  loaded = false;
  iFrame = null;
  key = "/";
  static handler = null;
  fetchDataAddress = "";
  constructor(options) {
    this.serverUrl = options.serverAddress;
    this.fetchDataAddress = options.fetchDataAddress || "/api/data";
    Contenu.handler = new EventHandler();
    Contenu.handler.initializeMessageListener();
    return this;
  }
  start() {
    Contenu.props = {};
    Contenu.data = {};
    observable(Contenu.data);
    if (this.iFrame) this.iFrame.remove();
    this.fetchDataFromServer();
    this.initIFrame(this.key);
  }
  setKey(key) {
    this.key = key;
    Contenu.props = {};
    Contenu.data = {};
    observable(Contenu.data);
    if (this.iFrame) this.iFrame.remove();
    this.fetchDataFromServer();
    this.initIFrame(this.key);
  }
  initIFrame(key) {
    this.iFrame = new IFrameInitializer(this.serverUrl, key);
    this.iFrame.mount(document.getElementsByTagName("body")[0]);
  }
  fetchDataFromServer() {
    console.log(this.serverUrl + this.fetchDataAddress + "?key=" + this.key);
    fetch(this.serverUrl + this.fetchDataAddress + "?key=" + this.key)
      .then(response => response.json())
      .then(res => {
        Parser.parse(res.content, Contenu.props, Contenu.data);
        Contenu.res = res.content;
        this.loaded = true;
      })
      .catch(error =>
        console.error("Contenu is unable to connect to server", error)
      );
  }
}
let parse = data => {
  let res = {};
  for (let key in data) {
    if (key !== "__value" && key !== "__path") {
      if (typeof data[key] === "object") {
        res[key] = parse(data[key]);
      } else res[key] = data[key];
    }
    if (typeof res[key] === "object") {
      if (
        Object.keys(res[key]).length == 1 &&
        typeof res.parse === "function"
      ) {
        res[key] = data[key].__value;
      }
    }
  }
  if (Object.keys(res).length == 0) {
    res = "";
  }
  return res;
};
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
          if (typeof target.__value !== "undefined") {
            return target.__value;
          }
          if (typeof target === "object" && Object.keys(target).length == 0)
            return null;
          return target;
        }
        if (typeof target[prop] === "string") {
          delete target.__value;
          set(target, prop, {
            __value: target[prop],
            __path: target.__path + "." + prop,
            parse: () => {
              return target[prop].__value
                ? target[prop].__value
                : Object.keys(parse(target[prop])).length == 1
                ? ""
                : parse(target[prop]);
            }
          });
        } else {
          if (typeof props[prop] === "undefined") {
            // request for new field

            props[prop] = {};
            delete target.__value;
            Contenu.handler.requestNewFields(
              Parser.compare(Contenu.props, Contenu.res)
            );
          }
          set(target, prop, {
            __value: "",
            __path: target.__path + "." + prop,
            parse: () => {
              return target[prop].__value
                ? target[prop].__value
                : Object.keys(parse(target[prop])).length == 1
                ? ""
                : parse(target[prop]);
            }
          });
        }
        return makeProxy(target[prop], props[prop]);
      }
    }
  });
};
var set;
var observable;
export default {
  install(Vue, options) {
    set = Vue.set;
    observable = Vue.observable;
    window.$contenu = new Contenu(options);

    if (options.router) {
      options.router.beforeEach((to, from, next) => {
        window.$contenu.setKey(to.path);
        Vue.prototype.$contenu = makeProxy(Contenu.data, Contenu.props);
        next();
      });
    } else {
      window.$contenu.start();
      Vue.prototype.$contenu = makeProxy(Contenu.data, Contenu.props);
    }
  }
};
