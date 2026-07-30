class DynamicModelWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._dataBinding = null;
    this._dimensions = [];
    this._measures = [];
    this._rows = [];
    this._filteredIndexes = [];
    this._searchText = "";
    this._currentPage = 1;
    this._pageSize = 50;
    this._title = "Dynamic Model Table";
    this._searchPlaceholder = "Search...";
    this._allowEditMeasures = true;
    this._buttons = [];
    this._lastEvent = "";
    this._validationResult = "true";
    this._validationErrors = [];
    this._suspendAttributeSync = false;
    this._rendered = false;
  }

  // Custom Widget SDK lifecycle hooks
  onCustomWidgetBeforeUpdate(changedProperties) {
    this._pendingChanges = changedProperties;
  }

  onCustomWidgetAfterUpdate(changedProperties) {
    if (!changedProperties) return;

    if ("myDataBinding" in changedProperties) {
      this._dataBinding = changedProperties["myDataBinding"];
      this._consumeDataBinding();
    }

    if ("title" in changedProperties) this._title = changedProperties["title"] || this._title;
    if ("searchPlaceholder" in changedProperties) this._searchPlaceholder = changedProperties["searchPlaceholder"] || this._searchPlaceholder;
    if ("pageSize" in changedProperties) this._pageSize = parseInt(changedProperties["pageSize"], 10) || 50;
    if ("allowEditMeasures" in changedProperties) this._allowEditMeasures = changedProperties["allowEditMeasures"] !== false;

    var buttonRelated = [
      "button1Text","button1Action","button1Style",
      "button2Text","button2Action","button2Style",
      "button3Text","button3Action","button3Style",
      "button4Text","button4Action","button4Style",
      "button5Text","button5Action","button5Style",
      "button6Text","button6Action","button6Style"
    ];
    var needButtonRebuild = false;
    for (var i = 0; i < buttonRelated.length; i++) {
      if (buttonRelated[i] in changedProperties) { needButtonRebuild = true; break; }
    }
    if (needButtonRebuild) {
      this._rebuildButtonsFromAttributes(changedProperties);
    }

    if (this._rendered) {
      this._render();
      this._rebuildFilteredIndexes();
      this._renderVisibleOnly();
    }
  }

  connectedCallback() {
    this._render();
    this._rebuildFilteredIndexes();
    this._renderVisibleOnly();
    this._rendered = true;
    this._dispatch("onReady");
  }

  // =========================
  // Consume data binding (model + dimensions + measures selected in Builder Panel)
  // =========================
  _consumeDataBinding() {
    var binding = this._dataBinding;
    if (!binding) {
      this._dimensions = [];
      this._measures = [];
      this._rows = [];
      return;
    }

    // Standard SAC custom widget dataBinding shape:
    // binding.dimensions -> [{ id, description, ... }]
    // binding.measures   -> [{ id, description, ... }]
    // binding.data       -> [ { <dimId>: {id,label}, <measureId>: {raw,formatted} }, ... ]
    this._dimensions = binding.dimensions || [];
    this._measures = binding.measures || [];

    var sourceRows = binding.data || [];
    var rows = [];

    for (var i = 0; i < sourceRows.length; i++) {
      var src = sourceRows[i];
      var row = { rowId: i + 1, selected: false, isModified: false };

      for (var d = 0; d < this._dimensions.length; d++) {
        var dim = this._dimensions[d];
        var dVal = src[dim.id];
        row["dim__" + dim.id] = dVal && dVal.label !== undefined ? dVal.label : (dVal && dVal.id !== undefined ? dVal.id : "");
      }

      for (var m = 0; m < this._measures.length; m++) {
        var mea = this._measures[m];
        var mVal = src[mea.id];
        row["mea__" + mea.id] = mVal && mVal.raw !== undefined ? mVal.raw : (mVal && mVal.formatted !== undefined ? mVal.formatted : "");
      }

      rows.push(row);
    }

    this._rows = rows;
    this._setManageDataProperty();
  }

  _getColumns() {
    var columns = [
      { key: "selected", label: "Sel", type: "checkbox", width: "60px" }
    ];

    for (var d = 0; d < this._dimensions.length; d++) {
      var dim = this._dimensions[d];
      columns.push({
        key: "dim__" + dim.id,
        label: dim.description || dim.id,
        type: "readonly",
        width: "170px"
      });
    }

    for (var m = 0; m < this._measures.length; m++) {
      var mea = this._measures[m];
      columns.push({
        key: "mea__" + mea.id,
        label: mea.description || mea.id,
        type: this._allowEditMeasures ? "number" : "readonly",
        width: "150px"
      });
    }

    return columns;
  }

  // =========================
  // Buttons from Builder Panel slots
  // =========================
  _rebuildButtonsFromAttributes(changedProperties) {
    var slots = [1, 2, 3, 4, 5, 6];
    var buttons = [];

    for (var i = 0; i < slots.length; i++) {
      var idx = slots[i];
      var text = changedProperties["button" + idx + "Text"] !== undefined
        ? changedProperties["button" + idx + "Text"]
        : (this._buttons[i] ? this._buttons[i].text : "");
      var action = changedProperties["button" + idx + "Action"] !== undefined
        ? changedProperties["button" + idx + "Action"]
        : (this._buttons[i] ? this._buttons[i].action : "");
      var style = changedProperties["button" + idx + "Style"] !== undefined
        ? changedProperties["button" + idx + "Style"]
        : (this._buttons[i] ? this._buttons[i].style : "default");

      if (text && String(text).trim() !== "") {
        buttons.push({ id: "btn" + idx, text: text, action: action, style: style });
      }
    }

    this._buttons = buttons;
  }

  // =========================
  // Public API
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

  getLastEvent() { return this._lastEvent || ""; }
  getValidationErrors() { return JSON.stringify(this._validationErrors || []); }
  getValidationResult() { return this._validationResult || "false"; }

  clear() {
    this._rows = [];
    this._validationErrors = [];
    this._validationResult = "true";
    this._lastEvent = "clear";
    this._setProperties();
    this._rebuildFilteredIndexes();
    this._renderVisibleOnly();
    this._dispatch("onDataChange");
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
    this._lastEvent = "validate";
    this._setProperties();
    this._renderVisibleOnly();
    this._dispatch("onValidate");
    return this._validationResult;
  }

  loadData() {
    this._lastEvent = "loadData";
    this._setProperties();
    this._dispatch("onDataChange");
  }

  saveData() {
    this._lastEvent = "saveData";
    this._setProperties();
    this._dispatch("onDataChange");
  }

  deleteSelected() {
    var kept = [];
    for (var i = 0; i < this._rows.length; i++) {
      if (this._rows[i].selected !== true) kept.push(this._rows[i]);
    }
    this._rows = kept;
    this._lastEvent = "deleteSelected";
    this._setProperties();
    this._rebuildFilteredIndexes();
    this._renderVisibleOnly();
    this._dispatch("onDataChange");
  }

  triggerButtonAction(actionName) {
    this._lastEvent = "customButton|" + String(actionName || "");
    this._setProperties();
    this._dispatch("onCustomButton");
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
    this._suspendAttributeSync = true;
    this.setAttribute("managedata", JSON.stringify(this._rows));
    this._suspendAttributeSync = false;
  }

  _setProperties() {
    this._setManageDataProperty();
    this._suspendAttributeSync = true;
    this.setAttribute("lastevent", this._lastEvent || "");
    this.setAttribute("validationresult", this._validationResult || "true");
    this.setAttribute("validationerrors", JSON.stringify(this._validationErrors || []));
    this._suspendAttributeSync = false;
  }

  _dispatch(name) {
    this.dispatchEvent(new CustomEvent(name, { detail: {} }));
  }

  // =========================
  // Render
  // =========================
  _render() {
    var style = "<style>" +
      ':host{display:block;font-family:"72",Arial,sans-serif;color:#223548;}' +
      ".wrap{border:1px solid #d9e2ef;border-radius:12px;background:#fff;overflow:hidden;}" +
      ".titleBar{padding:12px 14px;font-size:16px;font-weight:700;border-bottom:1px solid #e5edf7;}" +
      ".toolbarWrap{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px;border-bottom:1px solid #e5edf7;background:#f8fbff;flex-wrap:wrap;}" +
      ".searchBox{width:240px;height:34px;border:1px solid #c7d7ea;border-radius:8px;padding:0 10px;font-size:13px;}" +
      ".btn{border:1px solid #c7d7ea;background:#fff;color:#0a6ed1;border-radius:8px;padding:7px 12px;cursor:pointer;font-weight:600;font-size:12px;}" +
      ".btn.primary{background:#0a6ed1;color:#fff;border-color:#0a6ed1;}" +
      ".btn.danger{color:#bb1e1e;border-color:#efb4b4;background:#fff7f7;}" +
      ".gridWrap{overflow:auto;max-height:480px;}" +
      "table{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%;}" +
      "th,td{border-bottom:1px solid #edf2f7;padding:7px;white-space:nowrap;box-sizing:border-box;}" +
      "th{position:sticky;top:0;background:#eef4fb;font-size:12px;font-weight:700;text-align:left;}" +
      ".readonly-cell{padding:5px 8px;background:#f6f8fb;border:1px solid #d6dee8;border-radius:6px;font-size:13px;}" +
      ".cell{width:100%;box-sizing:border-box;height:32px;border:1px solid #c9d6e5;border-radius:6px;padding:4px 8px;font-size:13px;}" +
      ".empty-msg{padding:30px;text-align:center;color:#8a9bb0;}" +
      "</style>";

    var html = '<div class="wrap"><div class="titleBar">' + this._escapeHtml(this._title) + "</div>";
    html += '<div class="toolbarWrap"><input id="search" class="searchBox" placeholder="' + this._escapeHtml(this._searchPlaceholder) + '"/>';
    html += '<div id="buttonsWrap">' + this._renderButtonsHtml() + "</div></div>";
    html += '<div class="gridWrap"><table><thead><tr>';

    var columns = this._getColumns();
    for (var i = 0; i < columns.length; i++) {
      html += "<th>" + this._escapeHtml(columns[i].label) + "</th>";
    }
    html += '</tr></thead><tbody id="tbody"></tbody></table></div></div>';

    this.shadowRoot.innerHTML = style + html;

    var that = this;
    var search = this.shadowRoot.getElementById("search");
    if (search) {
      search.value = this._searchText;
      search.addEventListener("input", function () {
        that._searchText = search.value || "";
        that._rebuildFilteredIndexes();
        that._renderVisibleOnly();
      });
    }

    var btns = this.shadowRoot.querySelectorAll("[data-action]");
    Array.prototype.forEach.call(btns, function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-action");
        if (typeof that[action] === "function") {
          that[action]();
        } else {
          that.triggerButtonAction(action);
        }
      });
    });
  }

  _renderButtonsHtml() {
    var html = "";
    for (var i = 0; i < this._buttons.length; i++) {
      var b = this._buttons[i];
      var css = "btn";
      if (b.style === "primary") css += " primary";
      if (b.style === "danger") css += " danger";
      html += '<button class="' + css + '" data-action="' + this._escapeHtml(b.action || "") + '">' + this._escapeHtml(b.text) + "</button>";
    }
    return html;
  }

  _renderVisibleOnly() {
    var tbody = this.shadowRoot.getElementById("tbody");
    if (!tbody) return;

    var columns = this._getColumns();
    var visible = this._getPagedIndexes();

    if (visible.length === 0) {
      tbody.innerHTML = '<tr><td colspan="' + columns.length + '" class="empty-msg">No data. Bind a model with dimensions/measures in the Builder Panel.</td></tr>';
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
    var els = this.shadowRoot.querySelectorAll("[data-row][data-field]");
    Array.prototype.forEach.call(els, function (el) {
      var evt = el.type === "checkbox" ? "change" : "change";
      el.addEventListener(evt, function () {
        var rowIndex = parseInt(el.getAttribute("data-row"), 10);
        var field = el.getAttribute("data-field");
        var value = el.type === "checkbox" ? el.checked : el.value;
        that._rows[rowIndex][field] = value;
        that._rows[rowIndex].isModified = true;
        that._setManageDataProperty();
        that._dispatch("onDataChange");
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

if (!customElements.get("com-example-dynamic-model-widget")) {
  customElements.define("com-example-dynamic-model-widget", DynamicModelWidget);
}
