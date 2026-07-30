(function () {
  var template = document.createElement("template");
  template.innerHTML =
    "<style>" +
    ':host{display:block;font-family:"72",Arial,sans-serif;color:#223548;}' +
    ".wrap{border:1px solid #d9e2ef;border-radius:12px;background:#fff;overflow:hidden;height:100%;box-sizing:border-box;display:flex;flex-direction:column;}" +
    ".titleBar{padding:12px 14px;font-size:16px;font-weight:700;border-bottom:1px solid #e5edf7;}" +
    ".toolbarWrap{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px;border-bottom:1px solid #e5edf7;background:#f8fbff;flex-wrap:wrap;}" +
    ".searchBox{width:220px;height:32px;border:1px solid #c7d7ea;border-radius:8px;padding:0 10px;font-size:13px;}" +
    ".btnRow{display:flex;gap:8px;flex-wrap:wrap;}" +
    ".btn{border:1px solid #c7d7ea;background:#fff;color:#0a6ed1;border-radius:8px;padding:7px 12px;cursor:pointer;font-weight:600;font-size:12px;}" +
    ".btn.primary{background:#0a6ed1;color:#fff;border-color:#0a6ed1;}" +
    ".btn.danger{color:#bb1e1e;border-color:#efb4b4;background:#fff7f7;}" +
    ".gridWrap{overflow:auto;flex:1;}" +
    "table{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%;}" +
    "th,td{border-bottom:1px solid #edf2f7;padding:7px;white-space:nowrap;box-sizing:border-box;}" +
    "th{position:sticky;top:0;background:#eef4fb;font-size:12px;font-weight:700;text-align:left;}" +
    ".readonly-cell{padding:5px 8px;background:#f6f8fb;border:1px solid #d6dee8;border-radius:6px;font-size:13px;}" +
    ".cell{width:100%;box-sizing:border-box;height:30px;border:1px solid #c9d6e5;border-radius:6px;padding:4px 8px;font-size:13px;}" +
    ".empty-msg{padding:30px;text-align:center;color:#8a9bb0;}" +
    "</style>" +
    '<div class="wrap">' +
    '<div class="titleBar" id="titleBar"></div>' +
    '<div class="toolbarWrap">' +
    '<input id="search" class="searchBox" />' +
    '<div class="btnRow" id="buttonsWrap"></div>' +
    "</div>" +
    '<div class="gridWrap"><table><thead><tr id="headRow"></tr></thead><tbody id="tbody"></tbody></table></div>' +
    "</div>";

  var DynamicModelWidget = /** @class */ (function () {
    function DynamicModelWidget() {}
    return DynamicModelWidget;
  })();

  class DynamicModelWidgetElement extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(template.content.cloneNode(true));

      this._props = {};
      this._dimensions = [];
      this._measures = [];
      this._rows = [];
      this._filteredIndexes = [];
      this._searchText = "";
      this._currentPage = 1;
      this._pageSize = 50;
      this._buttons = [];
      this._rendered = false;

      var that = this;
      var search = this._shadowRoot.getElementById("search");
      search.addEventListener("input", function () {
        that._searchText = search.value || "";
        that._rebuildFilteredIndexes();
        that._renderVisibleOnly();
      });
    }

    // =========================
    // Lifecycle
    // =========================
    onCustomWidgetBeforeUpdate(changedProperties) {
      this._props = Object.assign({}, this._props, changedProperties);
    }

    onCustomWidgetAfterUpdate(changedProperties) {
      if ("myDataBinding" in changedProperties) {
        this._consumeDataBinding(changedProperties["myDataBinding"]);
      }
      if ("title" in changedProperties) {
        this._shadowRoot.getElementById("titleBar").textContent = changedProperties["title"] || "";
      }
      if ("searchPlaceholder" in changedProperties) {
        this._shadowRoot.getElementById("search").placeholder = changedProperties["searchPlaceholder"] || "";
      }
      if ("pageSize" in changedProperties) {
        this._pageSize = parseInt(changedProperties["pageSize"], 10) || 50;
      }
      if ("allowEditMeasures" in changedProperties) {
        this._allowEditMeasures = changedProperties["allowEditMeasures"] !== false;
      }
      if ("buttonsConfig" in changedProperties) {
        this._parseButtonsConfig(changedProperties["buttonsConfig"]);
      }

      this._renderButtons();
      this._renderHeader();
      this._rebuildFilteredIndexes();
      this._renderVisibleOnly();
    }

    connectedCallback() {
      this._rendered = true;
      this._fireEvent("onReady");
    }

    onCustomWidgetDestroy() {
      // cleanup if needed
    }

    // =========================
    // Data binding consumption
    // =========================
    _consumeDataBinding(binding) {
      if (!binding) {
        this._dimensions = [];
        this._measures = [];
        this._rows = [];
        return;
      }

      var metadata = binding.metadata || {};
      var dimIds = (metadata.feeds && metadata.feeds.dimensions && metadata.feeds.dimensions.values) || [];
      var measureIds = (metadata.feeds && metadata.feeds.measures && metadata.feeds.measures.values) || [];

      this._dimensions = dimIds.map(function (key) {
        var info = metadata.dimensions ? metadata.dimensions[key] : null;
        return { key: key, id: info ? info.id : key, description: info ? info.description : key };
      });

      this._measures = measureIds.map(function (key) {
        var info = metadata.mainStructureMembers ? metadata.mainStructureMembers[key] : null;
        return { key: key, id: info ? info.id : key, description: info ? info.label : key };
      });

      var sourceRows = binding.data || [];
      var rows = [];

      for (var i = 0; i < sourceRows.length; i++) {
        var src = sourceRows[i];
        var row = { rowId: i + 1, selected: false, isModified: false };

        for (var d = 0; d < this._dimensions.length; d++) {
          var dim = this._dimensions[d];
          var dVal = src[dim.key];
          row["dim__" + dim.key] = dVal && dVal.label !== undefined ? dVal.label : (dVal && dVal.id !== undefined ? dVal.id : "");
        }

        for (var m = 0; m < this._measures.length; m++) {
          var mea = this._measures[m];
          var mVal = src[mea.key];
          row["mea__" + mea.key] = mVal && mVal.raw !== undefined ? mVal.raw : (mVal && mVal.formatted !== undefined ? mVal.formatted : "");
        }

        rows.push(row);
      }

      this._rows = rows;
      this._setManageDataProperty();
    }

    _getColumns() {
      var columns = [{ key: "selected", label: "Sel", type: "checkbox" }];

      for (var d = 0; d < this._dimensions.length; d++) {
        columns.push({ key: "dim__" + this._dimensions[d].key, label: this._dimensions[d].description, type: "readonly" });
      }

      for (var m = 0; m < this._measures.length; m++) {
        columns.push({ key: "mea__" + this._measures[m].key, label: this._measures[m].description, type: this._allowEditMeasures ? "number" : "readonly" });
      }

      return columns;
    }

    // =========================
    // Dynamic buttons
    // =========================
    _parseButtonsConfig(configStr) {
      try {
        var parsed = JSON.parse(configStr || "[]");
        this._buttons = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        this._buttons = [];
      }
    }

    _renderButtons() {
      var wrap = this._shadowRoot.getElementById("buttonsWrap");
      wrap.innerHTML = "";

      var that = this;
      this._buttons.forEach(function (b) {
        var btn = document.createElement("button");
        var css = "btn";
        if (b.style === "primary") css += " primary";
        if (b.style === "danger") css += " danger";
        btn.className = css;
        btn.textContent = b.text || "Button";
        btn.addEventListener("click", function () {
          var action = b.action || "";
          if (typeof that[action] === "function") {
            that[action]();
          } else {
            that.triggerButtonAction(action);
          }
        });
        wrap.appendChild(btn);
      });
    }

    _renderHeader() {
      var headRow = this._shadowRoot.getElementById("headRow");
      var columns = this._getColumns();
      var html = "";
      for (var i = 0; i < columns.length; i++) {
        html += "<th>" + this._escapeHtml(columns[i].label) + "</th>";
      }
      headRow.innerHTML = html;
    }

    // =========================
    // Public script API methods (native JS implementations)
    // =========================
    getManageData() {
      return JSON.stringify(this._rows || []);
    }

    setManageData(dataStr) {
      try {
        var parsed = JSON.parse(String(dataStr || "[]"));
        this._rows = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        this._rows = [];
      }
      this._setManageDataProperty();
      this._rebuildFilteredIndexes();
      this._renderVisibleOnly();
    }

    getModifiedRows() {
      var out = [];
      for (var i = 0; i < this._rows.length; i++) {
        if (this._rows[i].isModified === true) out.push(this._rows[i]);
      }
      return JSON.stringify(out);
    }

    getSelectedRows() {
      var out = [];
      for (var i = 0; i < this._rows.length; i++) {
        if (this._rows[i].selected === true) out.push(this._rows[i]);
      }
      return JSON.stringify(out);
    }

    getLastEvent() {
      return this._lastEvent || "";
    }

    getValidationErrors() {
      return JSON.stringify(this._validationErrors || []);
    }

    getValidationResult() {
      return this._validationResult || "true";
    }

    clear() {
      this._rows = [];
      this._validationErrors = [];
      this._validationResult = "true";
      this._setManageDataProperty();
      this._setSimpleProperty("validationresult", "true");
      this._setSimpleProperty("validationerrors", "[]");
      this._rebuildFilteredIndexes();
      this._renderVisibleOnly();
      this._setLastEventAndFire("clear", "onDataChange");
    }

    validate() {
      var errors = [];
      var selectedCount = 0;

      for (var i = 0; i < this._rows.length; i++) {
        if (this._rows[i].selected === true) selectedCount++;
      }

      if (selectedCount === 0) {
        errors.push({ rowIndex: -1, messages: ["Please select at least one row."] });
      }

      this._validationErrors = errors;
      this._validationResult = errors.length === 0 ? "true" : "false";

      this._setSimpleProperty("validationerrors", JSON.stringify(errors));
      this._setSimpleProperty("validationresult", this._validationResult);
      this._renderVisibleOnly();
      this._setLastEventAndFire("validate", "onValidate");

      return this._validationResult;
    }

    loadData() {
      this._setLastEventAndFire("loadData", "onDataChange");
    }

    saveData() {
      this._setLastEventAndFire("saveData", "onDataChange");
    }

    deleteSelected() {
      var kept = [];
      for (var i = 0; i < this._rows.length; i++) {
        if (this._rows[i].selected !== true) kept.push(this._rows[i]);
      }
      this._rows = kept;
      this._setManageDataProperty();
      this._rebuildFilteredIndexes();
      this._renderVisibleOnly();
      this._setLastEventAndFire("deleteSelected", "onDataChange");
    }

    triggerButtonAction(actionName) {
      this._setLastEventAndFire("customButton|" + String(actionName || ""), "onCustomButton");
    }

    // =========================
    // Internal helpers
    // =========================
    _isRowVisible(row) {
      var search = String(this._searchText || "").toLowerCase().trim();
      if (!search) return true;
      var columns = this._getColumns();
      for (var i = 0; i < columns.length; i++) {
        var val = String(row[columns[i].key] || "").toLowerCase();
        if (val.indexOf(search) > -1) return true;
      }
      return false;
    }

    _rebuildFilteredIndexes() {
      this._filteredIndexes = [];
      for (var i = 0; i < this._rows.length; i++) {
        if (this._isRowVisible(this._rows[i])) this._filteredIndexes.push(i);
      }
      this._currentPage = 1;
    }

    _getPagedIndexes() {
      var start = (this._currentPage - 1) * this._pageSize;
      return this._filteredIndexes.slice(start, start + this._pageSize);
    }

    _setManageDataProperty() {
      this.managedata = JSON.stringify(this._rows);
      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: { properties: { managedata: this.managedata } }
        })
      );
    }

    _setSimpleProperty(name, value) {
      this[name] = value;
      var detailProps = {};
      detailProps[name] = value;
      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: { properties: detailProps }
        })
      );
    }

    _setLastEventAndFire(eventText, eventName) {
      this._lastEvent = eventText;
      this._setSimpleProperty("lastevent", eventText);
      this._fireEvent(eventName);
    }

    _fireEvent(name) {
      this.dispatchEvent(new Event(name));
    }

    _renderVisibleOnly() {
      var tbody = this._shadowRoot.getElementById("tbody");
      var columns = this._getColumns();
      var visible = this._getPagedIndexes();

      if (!visible.length) {
        tbody.innerHTML =
          '<tr><td colspan="' + columns.length + '" class="empty-msg">No data. Select a model and add dimensions/measures in the Builder Panel.</td></tr>';
        return;
      }

      var html = "";
      for (var i = 0; i < visible.length; i++) {
        var idx = visible[i];
        var row = this._rows[idx];
        html += "<tr>";
        for (var c = 0; c < columns.length; c++) {
          html += "<td>" + this._renderCell(row, idx, columns[c]) + "</td>";
        }
        html += "</tr>";
      }
      tbody.innerHTML = html;
      this._bindCellEvents();
    }

    _renderCell(row, rowIndex, col) {
      var value = row[col.key] !== undefined ? row[col.key] : "";

      if (col.type === "checkbox") {
        return '<input type="checkbox" data-row="' + rowIndex + '" data-field="' + col.key + '" ' + (value === true ? "checked" : "") + " />";
      }
      if (col.type === "readonly") {
        return '<div class="readonly-cell">' + this._escapeHtml(String(value)) + "</div>";
      }
      if (col.type === "number") {
        return '<input class="cell" type="number" data-row="' + rowIndex + '" data-field="' + col.key + '" value="' + this._escapeHtml(String(value)) + '" />';
      }
      return '<input class="cell" type="text" data-row="' + rowIndex + '" data-field="' + col.key + '" value="' + this._escapeHtml(String(value)) + '" />';
    }

    _bindCellEvents() {
      var that = this;
      var els = this._shadowRoot.querySelectorAll("[data-row][data-field]");
      Array.prototype.forEach.call(els, function (el) {
        el.addEventListener("change", function () {
          var rowIndex = parseInt(el.getAttribute("data-row"), 10);
          var field = el.getAttribute("data-field");
          var value = el.type === "checkbox" ? el.checked : el.value;
          that._rows[rowIndex][field] = value;
          that._rows[rowIndex].isModified = true;
          that._setManageDataProperty();
          that._fireEvent("onDataChange");
        });
      });
    }

    _escapeHtml(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }
  }

  customElements.define("com-example-dynamic-model-widget", DynamicModelWidgetElement);
})();
