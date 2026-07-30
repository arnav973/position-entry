(function () {
  var template = document.createElement("template");
  template.innerHTML = `
    <style>
      :host { display:block; font-family:Arial, sans-serif; padding:12px; color:#223548; }
      .row { margin-bottom:12px; }
      label { display:block; font-size:12px; font-weight:600; margin-bottom:6px; }
      input[type="color"] { width:100%; height:34px; border:1px solid #c7d7ea; border-radius:6px; }
      select { width:100%; padding:6px; border:1px solid #c7d7ea; border-radius:6px; }
    </style>
    <div class="row">
      <label>Header Color</label>
      <input id="headerColor" type="color" value="#eef4fb" />
    </div>
    <div class="row">
      <label>Primary Button Color</label>
      <input id="primaryColor" type="color" value="#0a6ed1" />
    </div>
    <div class="row">
      <label>Compact Mode</label>
      <select id="compactMode">
        <option value="false">Off</option>
        <option value="true">On</option>
      </select>
    </div>
  `;

  class DynamicModelWidgetStyling extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
      var that = this;
      ["headerColor", "primaryColor", "compactMode"].forEach(function (id) {
        var el = that.shadowRoot.getElementById(id);
        el.addEventListener("change", function () {
          that.dispatchEvent(new CustomEvent("propertiesChanged", {
            detail: { properties: { [id]: el.value } }
          }));
        });
      });
    }
  }

  customElements.define("com-example-dynamic-model-widget-styling", DynamicModelWidgetStyling);
})();
