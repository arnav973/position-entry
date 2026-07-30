(function () {
  var template = document.createElement("template");
  template.innerHTML =
    "<style>" +
    ":host{display:block;font-family:Arial,sans-serif;padding:12px;color:#223548;}" +
    ".row{margin-bottom:12px;}" +
    "label{display:block;font-size:12px;font-weight:600;margin-bottom:6px;}" +
    "input,select{width:100%;box-sizing:border-box;border:1px solid #c7d7ea;border-radius:6px;padding:7px 9px;font-size:12px;}" +
    ".btnCard{border:1px solid #d9e2ef;border-radius:8px;padding:8px;margin-bottom:8px;background:#f8fbff;}" +
    ".btnCardRow{display:flex;gap:6px;margin-bottom:6px;}" +
    ".btnCardRow input,.btnCardRow select{flex:1;}" +
    ".removeBtn{background:#fff7f7;border:1px solid #efb4b4;color:#bb1e1e;border-radius:6px;padding:5px 8px;cursor:pointer;font-size:11px;}" +
    ".addBtn{background:#0a6ed1;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;font-size:12px;font-weight:600;width:100%;}" +
    ".section{border:1px solid #d9e2ef;border-radius:8px;padding:10px;margin-bottom:14px;}" +
    ".sectionTitle{font-size:13px;font-weight:700;margin-bottom:10px;}" +
    "</style>" +
    '<div class="section">' +
    '<div class="sectionTitle">General</div>' +
    '<div class="row"><label>Title</label><input id="title" type="text" /></div>' +
    '<div class="row"><label>Search Placeholder</label><input id="searchPlaceholder" type="text" /></div>' +
    '<div class="row"><label>Page Size</label><input id="pageSize" type="number" min="1" /></div>' +
    '<div class="row"><label>Allow Edit Measures</label><select id="allowEditMeasures"><option value="true">Yes</option><option value="false">No</option></select></div>' +
    "</div>" +
    '<div class="section">' +
    '<div class="sectionTitle">Buttons</div>' +
    '<div id="buttonsList"></div>' +
    '<button class="addBtn" id="addButtonBtn" type="button">+ Add Button</button>' +
    "</div>";

  class DynamicModelWidgetStyling extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(template.content.cloneNode(true));
      this._buttons = [];

      var that = this;

      ["title", "searchPlaceholder", "pageSize", "allowEditMeasures"].forEach(function (id) {
        var el = that._shadowRoot.getElementById(id);
        el.addEventListener("change", function () {
          that._emitSingle(id, id === "pageSize" ? parseInt(el.value, 10) || 50 : el.value === "true" || el.value === "false" ? el.value === "true" : el.value);
        });
      });

      this._shadowRoot.getElementById("addButtonBtn").addEventListener("click", function () {
        that._buttons.push({ text: "New Button", action: "", style: "default" });
        that._renderButtonsList();
        that._emitButtonsConfig();
      });
    }

    // =========================
    // Property setters (called by framework when property values are set)
    // =========================
    set title(v) {
      this._shadowRoot.getElementById("title").value = v || "";
    }
    set searchPlaceholder(v) {
      this._shadowRoot.getElementById("searchPlaceholder").value = v || "";
    }
    set pageSize(v) {
      this._shadowRoot.getElementById("pageSize").value = v || 50;
    }
    set allowEditMeasures(v) {
      this._shadowRoot.getElementById("allowEditMeasures").value = v === false ? "false" : "true";
    }
    set buttonsConfig(v) {
      try {
        var parsed = JSON.parse(v || "[]");
        this._buttons = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        this._buttons = [];
      }
      this._renderButtonsList();
    }

    _renderButtonsList() {
      var list = this._shadowRoot.getElementById("buttonsList");
      list.innerHTML = "";

      var that = this;

      this._buttons.forEach(function (btn, index) {
        var card = document.createElement("div");
        card.className = "btnCard";

        var row1 = document.createElement("div");
        row1.className = "btnCardRow";

        var textInput = document.createElement("input");
        textInput.type = "text";
        textInput.placeholder = "Button text";
        textInput.value = btn.text || "";
        textInput.addEventListener("input", function () {
          btn.text = textInput.value;
          that._emitButtonsConfig();
        });

        var actionInput = document.createElement("input");
        actionInput.type = "text";
        actionInput.placeholder = "Action (e.g. loadData, saveData, validate, custom name)";
        actionInput.value = btn.action || "";
        actionInput.addEventListener("input", function () {
          btn.action = actionInput.value;
          that._emitButtonsConfig();
        });

        row1.appendChild(textInput);
        row1.appendChild(actionInput);

        var row2 = document.createElement("div");
        row2.className = "btnCardRow";

        var styleSelect = document.createElement("select");
        ["default", "primary", "danger"].forEach(function (opt) {
          var o = document.createElement("option");
          o.value = opt;
          o.textContent = opt;
          if (btn.style === opt) o.selected = true;
          styleSelect.appendChild(o);
        });
        styleSelect.addEventListener("change", function () {
          btn.style = styleSelect.value;
          that._emitButtonsConfig();
        });

        var removeBtn = document.createElement("button");
        removeBtn.className = "removeBtn";
        removeBtn.type = "button";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", function () {
          that._buttons.splice(index, 1);
          that._renderButtonsList();
          that._emitButtonsConfig();
        });

        row2.appendChild(styleSelect);
        row2.appendChild(removeBtn);

        card.appendChild(row1);
        card.appendChild(row2);
        list.appendChild(card);
      });
    }

    _emitButtonsConfig() {
      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: { properties: { buttonsConfig: JSON.stringify(this._buttons) } }
        })
      );
    }

    _emitSingle(propName, value) {
      var detail = {};
      detail[propName] = value;
      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: { properties: detail }
        })
      );
    }
  }

  customElements.define("com-example-dynamic-model-widget-styling", DynamicModelWidgetStyling);
})();
