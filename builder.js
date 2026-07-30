(function () {
  var template = document.createElement("template");
  template.innerHTML = `
    <style>
      :host {
        display: block;
        font-family: Arial, sans-serif;
        padding: 12px;
        color: #223548;
      }
      .section {
        margin-bottom: 16px;
        border: 1px solid #d9e2ef;
        border-radius: 8px;
        padding: 12px;
        background: #ffffff;
      }
      .title {
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 10px;
      }
      label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 6px;
      }
      input, select, textarea {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #c7d7ea;
        border-radius: 6px;
        padding: 8px 10px;
        font-size: 12px;
        margin-bottom: 10px;
      }
      textarea {
        min-height: 140px;
        resize: vertical;
        font-family: Consolas, monospace;
      }
      .hint {
        font-size: 11px;
        color: #6b7c93;
        margin-top: -4px;
        margin-bottom: 10px;
      }
      .btn {
        border: 1px solid #0a6ed1;
        background: #0a6ed1;
        color: #fff;
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        margin-right: 8px;
      }
      .btn.secondary {
        background: #fff;
        color: #0a6ed1;
      }
    </style>

    <div class="section">
      <div class="title">General</div>

      <label>Title</label>
      <input id="title" type="text" />

      <label>Search Placeholder</label>
      <input id="searchplaceholder" type="text" />

      <label>Page Size</label>
      <input id="pagesize" type="number" min="1" />

      <label>Data Mode</label>
      <select id="datamode">
        <option value="manual">manual</option>
        <option value="model">model</option>
      </select>
    </div>

    <div class="section">
      <div class="title">Schema JSON</div>
      <label>Columns Schema</label>
      <textarea id="schema"></textarea>
      <div class="hint">Define columns as JSON array. Example: [{ "key":"employeeId","label":"Position ID","type":"readonly","required":true }]</div>
      <button id="loadSchemaSample" class="btn secondary" type="button">Load Sample Schema</button>
    </div>

    <div class="section">
      <div class="title">Buttons JSON</div>
      <label>Toolbar Buttons</label>
      <textarea id="buttons"></textarea>
      <div class="hint">Define buttons as JSON array. Example: [{ "id":"btnSave","text":"Save","action":"saveData","style":"primary" }]</div>
      <button id="loadButtonsSample" class="btn secondary" type="button">Load Sample Buttons</button>
    </div>

    <div class="section">
      <div class="title">Model Binding JSON</div>
      <label>Model Binding</label>
      <textarea id="modelbinding"></textarea>
      <div class="hint">Map widget field keys to SAC resultset field names. Example: { "employeeId":"Position", "companyCode":"Company" }</div>
      <button id="loadBindingSample" class="btn secondary" type="button">Load Sample Binding</button>
    </div>
  `;

  class DynamicPositionManageBuilder extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
      this._bind();
    }

    _bind() {
      var ids = ["title", "searchplaceholder", "pagesize", "datamode", "schema", "buttons", "modelbinding"];
      var that = this;

      ids.forEach(function(id) {
        var el = that.shadowRoot.getElementById(id);
        if (el) {
          el.addEventListener("input", function() {
            that._emit(id, el.value);
          });
          el.addEventListener("change", function() {
            that._emit(id, el.value);
          });
        }
      });

      this.shadowRoot.getElementById("loadSchemaSample").addEventListener("click", function() {
        var sample = [
          { "key": "selected", "label": "Sel", "type": "checkbox", "width": "70px" },
          { "key": "employeeId", "label": "Position ID", "type": "readonly", "width": "170px", "required": true, "unique": true },
          { "key": "companyCode", "label": "Company Code", "type": "select", "width": "160px", "required": true },
          { "key": "division", "label": "Division", "type": "select", "width": "180px", "required": true },
          { "key": "department", "label": "Department", "type": "select", "width": "180px", "required": true },
          { "key": "positionTitle", "label": "Position Title", "type": "text", "width": "220px", "required": true },
          { "key": "hireDate", "label": "Hire Date", "type": "date", "width": "150px", "required": true },
          { "key": "comment", "label": "Comment", "type": "text", "width": "240px" }
        ];
        that.shadowRoot.getElementById("schema").value = JSON.stringify(sample, null, 2);
        that._emit("schema", JSON.stringify(sample));
      });

      this.shadowRoot.getElementById("loadButtonsSample").addEventListener("click", function() {
        var sample = [
          { "id": "btnLoad", "text": "Load Data", "action": "loadData", "style": "default" },
          { "id": "btnValidate", "text": "Validate", "action": "validate", "style": "default" },
          { "id": "btnSave", "text": "Save Changes", "action": "saveData", "style": "primary" },
          { "id": "btnDelete", "text": "Delete Selected", "action": "deleteSelected", "style": "danger" },
          { "id": "btnApprove", "text": "Approve", "action": "approveRows", "style": "primary" }
        ];
        that.shadowRoot.getElementById("buttons").value = JSON.stringify(sample, null, 2);
        that._emit("buttons", JSON.stringify(sample));
      });

      this.shadowRoot.getElementById("loadBindingSample").addEventListener("click", function() {
        var sample = {
          "employeeId": "Position",
          "companyCode": "Company",
          "division": "Division",
          "department": "Department",
          "positionTitle": "PositionTitle",
          "hireDate": "HireDate",
          "comment": "Comment"
        };
        that.shadowRoot.getElementById("modelbinding").value = JSON.stringify(sample, null, 2);
        that._emit("modelbinding", JSON.stringify(sample));
      });
    }

    _emit(key, value) {
      this.dispatchEvent(new CustomEvent("propertiesChanged", {
        detail: {
          properties: {
            [key]: value
          }
        }
      }));
    }

    set value(v) {
      if (!v) return;
      var keys = ["title", "searchplaceholder", "pagesize", "datamode", "schema", "buttons", "modelbinding"];
      for (var i = 0; i < keys.length; i++) {
        var el = this.shadowRoot.getElementById(keys[i]);
        if (el && v[keys[i]] !== undefined) {
          el.value = v[keys[i]];
        }
      }
    }
  }

  customElements.define("com-example-dynamic-position-manage-builder", DynamicPositionManageBuilder);
})();
