
/*
class PositionEntryWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._rows = [];
    this._options = {
      companyCode: [],
      division: [],
      department: [],
      costCenter: [],
      jobCode: [],
      payGradeGroup: [],
      payGradeLevel: [],
      nationality: [],
      accommodation: [],
      transport: [],
      employeeClass: [],
      overtime: [],
      specialApproval: []
    };
    this._rowOptions = {};
    this._lastEvent = "";
    this._sendPayload = "";
    this._validationResult = "true";
    this._validationErrors = [];
    this._suspendAttributeSync = false;

    this._dropdownPanel = null;
    this._dropdownSearch = null;
    this._dropdownList = null;
    this._dropdownOpen = false;
    this._activeDropdownTrigger = null;
    this._activeDropdownRow = -1;
    this._activeDropdownField = "";
    this._activeDropdownOptions = [];
    this._activeDropdownSelectedKey = "";

    this._columns = [
      { key: "selected", label: "Sel", type: "checkbox", width: "60px" },
      { key: "companyCode", label: "Company Code", type: "select", width: "160px" },
      { key: "division", label: "Division", type: "select", width: "180px" },
      { key: "department", label: "Department", type: "select", width: "190px" },
      { key: "costCenter", label: "Cost Center", type: "select", width: "190px" },
      { key: "jobCode", label: "Job Code", type: "select", width: "190px" },
      { key: "positionTitle", label: "Position Title", type: "text", width: "220px" },
      { key: "employeeId", label: "Employee ID", type: "text", width: "170px" },
      { key: "payGradeGroup", label: "Pay Grade", type: "select", width: "130px" },
      { key: "payGradeLevel", label: "Level", type: "select", width: "110px" },
      { key: "hireDate", label: "Hire Date", type: "date", width: "150px" },
      { key: "nationality", label: "Nationality", type: "select", width: "160px" },
      { key: "accommodation", label: "Accommodation", type: "select", width: "160px" },
      { key: "transport", label: "Transport", type: "select", width: "150px" },
      { key: "employeeClass", label: "Employee Class", type: "select", width: "160px" },
      { key: "overtime", label: "Overtime", type: "select", width: "130px" },
      { key: "specialApproval", label: "Special Approval", type: "select", width: "170px" },
      { key: "comment", label: "Comment", type: "text", width: "260px" }
    ];
  }

  connectedCallback() {
    if (!this._rows.length) {
      this._rows = [this._createEmptyRow(1)];
    }
    this._createDropdownPanel();
    this._render();
    this._fireReady();
  }

  disconnectedCallback() {
    this._closeDropdown();
    if (this._dropdownPanel && this._dropdownPanel.parentNode) {
      this._dropdownPanel.parentNode.removeChild(this._dropdownPanel);
    }
    this._dropdownPanel = null;
  }

  static get observedAttributes() {
    return ["data", "lastevent", "validationresult", "validationerrors", "sendforapprovalpayload"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }

    if (this._suspendAttributeSync) {
      return;
    }

    if (name === "data") {
      try {
        var parsed = JSON.parse(newValue || "[]");
        if (Array.isArray(parsed)) {
          this._rows = parsed;
          this._syncRowIds();
          this._render();
        }
      } catch (e) {}
    }
  }

  getData() {
    var result = "";
    var i = 0;

    for (i = 0; i < this._rows.length; i++) {
      var r = this._rows[i];

      if (result !== "") {
        result = result + "||";
      }

      result = result
        + "rowId::" + this._safeValue(r.rowId) + "~~"
        + "selected::" + this._safeValue(r.selected ? "true" : "false") + "~~"
        + "companyCode::" + this._safeValue(r.companyCode) + "~~"
        + "division::" + this._safeValue(r.division) + "~~"
        + "department::" + this._safeValue(r.department) + "~~"
        + "costCenter::" + this._safeValue(r.costCenter) + "~~"
        + "jobCode::" + this._safeValue(r.jobCode) + "~~"
        + "positionTitle::" + this._safeValue(r.positionTitle) + "~~"
        + "employeeId::" + this._safeValue(r.employeeId) + "~~"
        + "payGradeGroup::" + this._safeValue(r.payGradeGroup) + "~~"
        + "payGradeLevel::" + this._safeValue(r.payGradeLevel) + "~~"
        + "hireDate::" + this._safeValue(r.hireDate) + "~~"
        + "nationality::" + this._safeValue(r.nationality) + "~~"
        + "accommodation::" + this._safeValue(r.accommodation) + "~~"
        + "transport::" + this._safeValue(r.transport) + "~~"
        + "employeeClass::" + this._safeValue(r.employeeClass) + "~~"
        + "overtime::" + this._safeValue(r.overtime) + "~~"
        + "specialApproval::" + this._safeValue(r.specialApproval) + "~~"
        + "comment::" + this._safeValue(r.comment);
    }

    return result;
  }

  _safeValue(value) {
    if (value === undefined || value === null) {
      return "";
    }

    return String(value)
      .replace(/\|\|/g, " ")
      .replace(/~~/g, " ")
      .replace(/::/g, " ");
  }

  setData(dataStr) {
    try {
      var parsed = JSON.parse(dataStr || "[]");
      if (Array.isArray(parsed)) {
        this._rows = parsed;
      } else {
        this._rows = [this._createEmptyRow(1)];
      }
    } catch (e) {
      this._rows = [this._createEmptyRow(1)];
    }

    this._syncRowIds();
    this._setDataProperty();
    this._render();
  }

  addRow() {
    var nextId = this._rows.length + 1;
    this._rows.push(this._createEmptyRow(nextId));
    this._setDataProperty();
    this._render();
    this._dispatch("onDataChange");
  }
   copySelectedRows() {
  var copiedRows = [];
  var copiedRowOptions = {};
  var copiedCompanyEvents = [];
  var i = 0;

  for (i = 0; i < this._rows.length; i++) {
    if (this._rows[i].selected === true) {
      var source = this._rows[i];
      var newIndex = this._rows.length + copiedRows.length;

      var newRow = {
        rowId: this._rows.length + copiedRows.length + 1,
        selected: false,
        companyCode: source.companyCode,
        division: source.division,
        department: source.department,
        costCenter: source.costCenter,
        jobCode: source.jobCode,
        positionTitle: source.positionTitle,
        employeeId: "",
        payGradeGroup: source.payGradeGroup,
        payGradeLevel: source.payGradeLevel,
        hireDate: source.hireDate,
        nationality: source.nationality,
        accommodation: source.accommodation,
        transport: source.transport,
        employeeClass: source.employeeClass,
        overtime: source.overtime,
        specialApproval: source.specialApproval,
        comment: source.comment
      };

      copiedRows.push(newRow);

      if (this._rowOptions[i]) {
        copiedRowOptions[newIndex] = JSON.parse(JSON.stringify(this._rowOptions[i]));
      }

      copiedCompanyEvents.push({
        rowIndex: newIndex,
        companyCode: source.companyCode
      });
    }
  }

  if (copiedRows.length === 0) {
    return;
  }

  for (i = 0; i < copiedRows.length; i++) {
    this._rows.push(copiedRows[i]);
  }

  for (var key in copiedRowOptions) {
    this._rowOptions[key] = copiedRowOptions[key];
  }

  this._syncRowIds();
  this._validationErrors = [];
  this._validationResult = "true";
  this._setProperties();
  this._render();

  for (i = 0; i < copiedCompanyEvents.length; i++) {
    this._fireFieldChange(copiedCompanyEvents[i].rowIndex, "companyCode", copiedCompanyEvents[i].companyCode);
  }
}


  clear() {
    this._rows = [this._createEmptyRow(1)];
    this._validationErrors = [];
    this._validationResult = "true";
    this._lastEvent = "clear";
    this._sendPayload = "";
    this._setProperties();
    this._render();
    this._dispatch("onDataChange");
  }

  validate() {
    var result = this._validateAllRows();
    this._validationErrors = result.errors;
    this._validationResult = result.isValid ? "true" : "false";
    this._lastEvent = "validateOnly";
    this._setProperties();
    this._render();
    this._dispatch("onValidate");
    return this._validationResult;
  }

  setOptions(fieldName, optionsStr) {
    try {
      var arr = JSON.parse(optionsStr || "[]");
      if (!Array.isArray(arr)) {
        arr = [];
      }
      this._options[fieldName] = arr;
      this._render();
    } catch (e) {}
  }

  setRowOptions(rowIndex, fieldName, optionsStr) {
    try {
      var arr = JSON.parse(optionsStr || "[]");
      if (!Array.isArray(arr)) {
        arr = [];
      }

      if (!this._rowOptions[rowIndex]) {
        this._rowOptions[rowIndex] = {};
      }

      this._rowOptions[rowIndex][fieldName] = arr;
      this._render();
    } catch (e) {}
  }

  setCellValue(rowIndex, fieldName, value) {
    if (!this._rows[rowIndex]) {
      return;
    }

    this._rows[rowIndex][fieldName] = value;
    this._setDataProperty();

    var inputEl = this.shadowRoot.querySelector('[data-row="' + rowIndex + '"][data-field="' + fieldName + '"]');
    if (inputEl && inputEl.tagName === "INPUT") {
      if (inputEl.type === "checkbox") {
        inputEl.checked = value === true;
      } else {
        inputEl.value = value;
      }
    }

    var trigger = this.shadowRoot.querySelector('.dropdown-trigger[data-row="' + rowIndex + '"][data-field="' + fieldName + '"]');
    if (trigger) {
      trigger.querySelector(".label").textContent = this._getOptionText(rowIndex, fieldName, value) || "Select";
    }
  }

  getLastEvent() {
    return this._lastEvent || "";
  }

  getSendForApprovalPayload() {
    return this._sendPayload || "";
  }

  getValidationErrors() {
    return JSON.stringify(this._validationErrors || []);
  }

  getValidationResult() {
    return this._validationResult || "false";
  }

  clearRowsAfterSend() {
    this._rows = [this._createEmptyRow(1)];
    this._validationErrors = [];
    this._validationResult = "true";
    this._lastEvent = "clearAfterSend";
    this._sendPayload = "";
    this._setProperties();
    this._render();
  }

  _createEmptyRow(rowId) {
    return {
      rowId: rowId,
      selected: false,
      companyCode: "",
      division: "",
      department: "",
      costCenter: "",
      jobCode: "",
      positionTitle: "",
      employeeId: "",
      payGradeGroup: "",
      payGradeLevel: "",
      hireDate: "",
      nationality: "",
      accommodation: "Yes",
      transport: "Yes",
      employeeClass: "Regular",
      overtime: "Yes",
      specialApproval: "No",
      comment: ""
    };
  }

  _syncRowIds() {
    for (var i = 0; i < this._rows.length; i++) {
      this._rows[i].rowId = i + 1;
    }
  }

  _getOptionsForCell(rowIndex, fieldName) {
    if (
      this._rowOptions[rowIndex] &&
      this._rowOptions[rowIndex][fieldName] &&
      Array.isArray(this._rowOptions[rowIndex][fieldName])
    ) {
      return this._rowOptions[rowIndex][fieldName];
    }

    return this._options[fieldName] || [];
  }

  _getOptionText(rowIndex, fieldName, value) {
    var opts = this._getOptionsForCell(rowIndex, fieldName);
    var i = 0;
    for (i = 0; i < opts.length; i++) {
      if (String(opts[i].key) === String(value)) {
        return opts[i].text !== undefined ? opts[i].text : opts[i].key;
      }
    }
    return "";
  }

  _setProperties() {
    this._setDataProperty();
    this._suspendAttributeSync = true;
    this.setAttribute("lastevent", this._lastEvent || "");
    this.setAttribute("validationresult", this._validationResult || "true");
    this.setAttribute("validationerrors", JSON.stringify(this._validationErrors || []));
    this.setAttribute("sendforapprovalpayload", this._sendPayload || "");
    this._suspendAttributeSync = false;
  }

  _setDataProperty() {
    this._suspendAttributeSync = true;
    this.setAttribute("data", JSON.stringify(this._rows));
    this._suspendAttributeSync = false;
  }

  _dispatch(name) {
    this.dispatchEvent(new CustomEvent(name, {
      detail: {}
    }));
  }

  _fireReady() {
    this._lastEvent = "ready";
    this._setProperties();
    this._dispatch("onReady");
  }

  _fireFieldChange(rowIndex, fieldName, value) {
    this._lastEvent = "fieldChange|" + String(rowIndex) + "|" + String(fieldName) + "|" + String(value);
    this._setProperties();
    this._dispatch("onDataChange");
  }

  _deleteSelectedRows() {
    var filtered = [];
    for (var i = 0; i < this._rows.length; i++) {
      if (this._rows[i].selected !== true) {
        filtered.push(this._rows[i]);
      }
    }

    if (!filtered.length) {
      filtered = [this._createEmptyRow(1)];
    }

    this._rows = filtered;
    this._syncRowIds();
    this._setProperties();
    this._render();
    this._dispatch("onDataChange");
  }

  _validateAllRows() {
    var errors = [];
    var employeeMap = {};
    var i = 0;

    for (i = 0; i < this._rows.length; i++) {
      var row = this._rows[i];

      if (row.employeeId && row.employeeId !== "") {
        if (!employeeMap[row.employeeId]) {
          employeeMap[row.employeeId] = 1;
        } else {
          employeeMap[row.employeeId] = employeeMap[row.employeeId] + 1;
        }
      }
    }

    for (i = 0; i < this._rows.length; i++) {
      var rowErr = [];
      var r = this._rows[i];

      if (!r.companyCode) rowErr.push("Company Code is required");
      if (!r.division) rowErr.push("Division is required");
      if (!r.department) rowErr.push("Department is required");
      if (!r.costCenter) rowErr.push("Cost Center is required");
      if (!r.jobCode) rowErr.push("Job Code is required");
      if (!r.positionTitle) rowErr.push("Position Title is required");
      if (!r.employeeId) rowErr.push("Employee ID is required");
      if (!r.hireDate) rowErr.push("Hire Date is required");

      if (r.employeeId && employeeMap[r.employeeId] > 1) {
        rowErr.push("Duplicate Employee ID in widget rows");
      }

      if (r.specialApproval === "Yes" && !r.comment) {
        rowErr.push("Comment is required when Special Approval = Yes");
      }

      if (rowErr.length > 0) {
        errors.push({
          rowIndex: i,
          rowId: r.rowId,
          messages: rowErr
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  _getRowErrorMap() {
    var map = {};
    for (var i = 0; i < this._validationErrors.length; i++) {
      map[this._validationErrors[i].rowIndex] = this._validationErrors[i].messages;
    }
    return map;
  }

  _createDropdownPanel() {
    if (this._dropdownPanel) {
      return;
    }

    var panel = document.createElement("div");
    panel.className = "position-widget-dropdown-panel";
    panel.style.display = "none";

    panel.innerHTML = `
      <div class="dropdown-search-wrap">
        <input type="text" class="dropdown-search-input" placeholder="Search..." />
      </div>
      <div class="dropdown-list"></div>
    `;

    document.body.appendChild(panel);

    this._dropdownPanel = panel;
    this._dropdownSearch = panel.querySelector(".dropdown-search-input");
    this._dropdownList = panel.querySelector(".dropdown-list");

    var that = this;

    this._dropdownSearch.addEventListener("input", function() {
      that._renderDropdownItems(this.value);
    });

    document.addEventListener("click", function(e) {
      if (!that._dropdownOpen) {
        return;
      }

      var clickInsidePanel = that._dropdownPanel && that._dropdownPanel.contains(e.target);
      var clickOnTrigger = that._activeDropdownTrigger && that._activeDropdownTrigger.contains(e.target);

      if (!clickInsidePanel && !clickOnTrigger) {
        that._closeDropdown();
      }
    });
  }

  _openDropdown(triggerEl, rowIndex, fieldName) {
    this._createDropdownPanel();

    this._activeDropdownTrigger = triggerEl;
    this._activeDropdownRow = rowIndex;
    this._activeDropdownField = fieldName;
    this._activeDropdownOptions = this._getOptionsForCell(rowIndex, fieldName) || [];
    this._activeDropdownSelectedKey = this._rows[rowIndex] ? this._rows[rowIndex][fieldName] : "";

    var rect = triggerEl.getBoundingClientRect();
    var panelWidth = Math.max(rect.width, 260);
    var top = rect.bottom + 4;
    var left = rect.left;

    if (left + panelWidth > window.innerWidth - 10) {
      left = window.innerWidth - panelWidth - 10;
    }
    if (left < 10) {
      left = 10;
    }

    this._dropdownPanel.style.display = "block";
    this._dropdownPanel.style.position = "fixed";
    this._dropdownPanel.style.left = left + "px";
    this._dropdownPanel.style.top = top + "px";
    this._dropdownPanel.style.width = panelWidth + "px";
    this._dropdownPanel.style.zIndex = "999999";

    this._dropdownSearch.value = "";
    this._renderDropdownItems("");
    this._dropdownOpen = true;

    setTimeout(() => {
      this._dropdownSearch.focus();
    }, 0);
  }

  _closeDropdown() {
    if (this._dropdownPanel) {
      this._dropdownPanel.style.display = "none";
    }

    this._dropdownOpen = false;
    this._activeDropdownTrigger = null;
    this._activeDropdownRow = -1;
    this._activeDropdownField = "";
    this._activeDropdownOptions = [];
    this._activeDropdownSelectedKey = "";
  }

  _renderDropdownItems(searchText) {
    if (!this._dropdownList) {
      return;
    }

    var that = this;
    var search = String(searchText || "").toLowerCase().trim();
    var items = this._activeDropdownOptions || [];
    var filtered = [];
    var i = 0;

    for (i = 0; i < items.length; i++) {
      var key = items[i].key !== undefined ? String(items[i].key) : "";
      var text = items[i].text !== undefined ? String(items[i].text) : key;
      var combined = (key + " " + text).toLowerCase();

      if (search === "" || combined.indexOf(search) > -1) {
        filtered.push({
          key: key,
          text: text
        });
      }
    }

    this._dropdownList.innerHTML = "";

    if (filtered.length === 0) {
      this._dropdownList.innerHTML = `<div class="dropdown-empty">No results found</div>`;
      return;
    }

    for (i = 0; i < filtered.length; i++) {
      var item = document.createElement("div");
      item.className = "dropdown-item";
      if (String(filtered[i].key) === String(this._activeDropdownSelectedKey)) {
        item.className += " selected";
      }

      item.textContent = filtered[i].text;
      item.setAttribute("data-key", filtered[i].key);
      item.setAttribute("data-text", filtered[i].text);

      item.addEventListener("mousedown", function(e) {
        e.preventDefault();

        var key = this.getAttribute("data-key");
        that._rows[that._activeDropdownRow][that._activeDropdownField] = key;
        that._validationErrors = [];
        that._validationResult = "true";
        that._setProperties();
        that._render();
        that._fireFieldChange(that._activeDropdownRow, that._activeDropdownField, key);
        that._closeDropdown();
      });

      this._dropdownList.appendChild(item);
    }
  }

  _render() {
    var that = this;
    var rowErrorMap = this._getRowErrorMap();

    var style = `
      <style>
        :host {
          display: block;
          font-family: "72", Arial, sans-serif;
          color: #223548;
        }
        .wrap {
          border: 1px solid #d9e2ef;
          border-radius: 12px;
          background: #ffffff;
          overflow: hidden;
        }
        .toolbar {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 12px;
          border-bottom: 1px solid #e5edf7;
          background: #f8fbff;
        }
        .btn {
          border: 1px solid #c7d7ea;
          background: #ffffff;
          color: #0a6ed1;
          border-radius: 8px;
          padding: 8px 14px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
        }
        .btn:hover {
          background: #f3f8fd;
        }
        .btn.primary {
          background: #0a6ed1;
          color: #ffffff;
          border-color: #0a6ed1;
        }
        .btn.primary:hover {
          background: #085caf;
        }
        .gridWrap {
          overflow: auto;
          max-height: 460px;
          background: #ffffff;
        }
        table {
          border-collapse: separate;
          border-spacing: 0;
          width: max-content;
          min-width: 100%;
        }
        th, td {
          border-bottom: 1px solid #edf2f7;
          padding: 8px;
          vertical-align: top;
          white-space: nowrap;
        }
        th {
          position: sticky;
          top: 0;
          background: #eef4fb;
          z-index: 1;
          text-align: left;
          font-size: 12px;
          color: #223548;
          font-weight: 700;
        }
        tr:hover td {
          background: #fafcff;
        }
        tr.errorRow td {
          background: #fff7f7;
        }
        .cell {
          width: 100%;
          box-sizing: border-box;
          min-height: 34px;
          height: 34px;
          border: 1px solid #c9d6e5;
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 13px;
          background: #fff;
          color: #223548;
          outline: none;
        }
        .cell:focus {
          border-color: #0a6ed1;
          box-shadow: 0 0 0 2px rgba(10,110,209,0.12);
        }
        .cell.error,
        .dropdown-trigger.error {
          border-color: #e25555;
          background: #fff5f5;
        }
        .rowErr {
          margin-top: 4px;
          font-size: 11px;
          color: #c53030;
          white-space: normal;
          max-width: 240px;
          line-height: 1.3;
        }
        .summary {
          padding: 10px 12px;
          border-top: 1px solid #e5edf7;
          display: flex;
          gap: 18px;
          font-size: 12px;
          background: #fafcff;
        }
        .dropdown-trigger {
          width: 100%;
          min-height: 34px;
          height: 34px;
          border: 1px solid #c9d6e5;
          border-radius: 6px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          padding: 0 10px;
          cursor: pointer;
          font-size: 13px;
          color: #223548;
          user-select: none;
        }
        .dropdown-trigger:hover {
          border-color: #9fb3c8;
        }
        .dropdown-trigger:focus {
          border-color: #0a6ed1;
          box-shadow: 0 0 0 2px rgba(10,110,209,0.12);
        }
        .dropdown-trigger .label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding-right: 8px;
        }
        .dropdown-trigger .arrow {
          color: #6a7f94;
          font-size: 11px;
          flex: 0 0 auto;
        }
      </style>
    `;

    var html = `
      <div class="wrap">
        <div class="toolbar">
          <button class="btn" id="btnAdd">Add Row</button>
          <button class="btn" id="btnCopy">Copy</button>
          <button class="btn" id="btnDelete">Delete Selected</button>
          <button class="btn" id="btnValidate">Validate</button>
          <button class="btn primary" id="btnSendForApproval">Send for Approval</button>
          <button class="btn" id="btnClear">Clear</button>
        </div>
        <div class="gridWrap" id="gridWrap">
          <table>
            <thead>
              <tr>
                ${this._columns.map(function(col) {
                  return `<th style="width:${col.width}">${col.label}</th>`;
                }).join("")}
              </tr>
            </thead>
            <tbody>
              ${this._rows.map(function(row, rowIndex) {
                var rowErrors = rowErrorMap[rowIndex] || [];
                return `
                  <tr class="${rowErrors.length ? "errorRow" : ""}">
                    ${that._columns.map(function(col) {
                      return `<td style="width:${col.width}">${that._renderCell(row, rowIndex, col, rowErrors)}</td>`;
                    }).join("")}
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
        <div class="summary">
          <div>Total Rows: ${this._rows.length}</div>
          <div>Validation: ${this._validationResult}</div>
          <div>Error Rows: ${this._validationErrors.length}</div>
        </div>
      </div>
    `;

    var oldGrid = this.shadowRoot.getElementById("gridWrap");
    var scrollLeft = oldGrid ? oldGrid.scrollLeft : 0;
    var scrollTop = oldGrid ? oldGrid.scrollTop : 0;

    this.shadowRoot.innerHTML = style + html;

    var newGrid = this.shadowRoot.getElementById("gridWrap");
    if (newGrid) {
      newGrid.scrollLeft = scrollLeft;
      newGrid.scrollTop = scrollTop;
    }

    this.shadowRoot.getElementById("btnAdd").addEventListener("click", function() {
      that.addRow();
    });

    this.shadowRoot.getElementById("btnCopy").addEventListener("click", function() {
      that.copySelectedRows();
    });

    this.shadowRoot.getElementById("btnDelete").addEventListener("click", function() {
      that._deleteSelectedRows();
    });

    this.shadowRoot.getElementById("btnValidate").addEventListener("click", function() {
      that.validate();
    });

    this.shadowRoot.getElementById("btnSendForApproval").addEventListener("click", function() {
      var result = that._validateAllRows();
      that._validationErrors = result.errors;
      that._validationResult = result.isValid ? "true" : "false";
      that._setProperties();
      that._render();

      if (!result.isValid) {
        that._lastEvent = "validationFailed";
        that._setProperties();
        that._dispatch("onValidate");
        return;
      }

      that._sendPayload = that.getData();
      that._lastEvent = "sendForApproval";
      that._setProperties();
      that._dispatch("onDataChange");
    });

    this.shadowRoot.getElementById("btnClear").addEventListener("click", function() {
      that.clear();
    });

    this._bindCellEvents();
  }

  _renderCell(row, rowIndex, col, rowErrors) {
    var hasError = this._hasFieldError(col.key, rowErrors);
    var errClass = hasError ? "error" : "";
    var value = row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : "";

    if (col.type === "checkbox") {
      return `
        <input class="cell ${errClass}" data-row="${rowIndex}" data-field="${col.key}" data-type="${col.type}" type="checkbox" ${value === true ? "checked" : ""} />
      `;
    }

    if (col.type === "select") {
      var selectedText = this._getOptionText(rowIndex, col.key, value);
      if (!selectedText) {
        selectedText = "Select";
      }

      return `
        <div
          class="dropdown-trigger ${errClass}"
          tabindex="0"
          data-row="${rowIndex}"
          data-field="${col.key}"
          data-type="${col.type}"
        >
          <span class="label">${this._escapeHtml(String(selectedText))}</span>
          <span class="arrow">▼</span>
        </div>
        ${this._renderFieldErrors(col.key, rowErrors)}
      `;
    }

    return `
      <input
        class="cell ${errClass}"
        data-row="${rowIndex}"
        data-field="${col.key}"
        data-type="${col.type}"
        type="${col.type === "date" ? "date" : col.type === "number" ? "number" : "text"}"
        value="${this._escapeHtml(String(value))}"
      />
      ${this._renderFieldErrors(col.key, rowErrors)}
    `;
  }

  _renderFieldErrors(fieldName, rowErrors) {
    var matched = [];
    for (var i = 0; i < rowErrors.length; i++) {
      var msg = rowErrors[i];
      if (
        (fieldName === "companyCode" && msg.indexOf("Company Code") === 0) ||
        (fieldName === "division" && msg.indexOf("Division") === 0) ||
        (fieldName === "department" && msg.indexOf("Department") === 0) ||
        (fieldName === "costCenter" && msg.indexOf("Cost Center") === 0) ||
        (fieldName === "jobCode" && msg.indexOf("Job Code") === 0) ||
        (fieldName === "positionTitle" && msg.indexOf("Position Title") === 0) ||
        (fieldName === "employeeId" && (msg.indexOf("Employee ID") === 0 || msg.indexOf("Duplicate Employee ID") === 0)) ||
        (fieldName === "hireDate" && msg.indexOf("Hire Date") === 0) ||
        (fieldName === "comment" && msg.indexOf("Comment") === 0)
      ) {
        matched.push(msg);
      }
    }

    if (!matched.length) {
      return "";
    }

    return `<div class="rowErr">${matched.join("<br>")}</div>`;
  }

  _hasFieldError(fieldName, rowErrors) {
    return this._renderFieldErrors(fieldName, rowErrors) !== "";
  }

  _bindCellEvents() {
    var that = this;

    var allInputs = this.shadowRoot.querySelectorAll("[data-row][data-field]");

    allInputs.forEach(function(el) {
      var type = el.getAttribute("data-type");

      if (type === "checkbox") {
        el.addEventListener("change", function() {
          var rowIndex = parseInt(this.getAttribute("data-row"), 10);
          var field = this.getAttribute("data-field");
          var value = this.checked;

          that._rows[rowIndex][field] = value;
          that._validationErrors = [];
          that._validationResult = "true";
          that._setProperties();
          that._fireFieldChange(rowIndex, field, value);
        });
        return;
      }

      if (type === "select") {
        el.addEventListener("click", function(e) {
          e.stopPropagation();
          var rowIndex = parseInt(this.getAttribute("data-row"), 10);
          var field = this.getAttribute("data-field");
          that._openDropdown(this, rowIndex, field);
        });

        el.addEventListener("keydown", function(e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            var rowIndex = parseInt(this.getAttribute("data-row"), 10);
            var field = this.getAttribute("data-field");
            that._openDropdown(this, rowIndex, field);
          }
        });
        return;
      }

      el.addEventListener("input", function() {
        var rowIndex = parseInt(this.getAttribute("data-row"), 10);
        var field = this.getAttribute("data-field");
        var value = this.value;

        that._rows[rowIndex][field] = value;
        that._validationErrors = [];
        that._validationResult = "true";
        that._setDataProperty();
      });

      el.addEventListener("change", function() {
        var rowIndex = parseInt(this.getAttribute("data-row"), 10);
        var field = this.getAttribute("data-field");
        var value = this.value;

        that._rows[rowIndex][field] = value;
        that._validationErrors = [];
        that._validationResult = "true";
        that._setProperties();
        that._fireFieldChange(rowIndex, field, value);
      });
    });
  }

  _escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

if (!customElements.get("com-example-position-entry")) {
  customElements.define("com-example-position-entry", PositionEntryWidget);
}

(function() {
  if (document.getElementById("position-widget-dropdown-global-style")) {
    return;
  }

  var style = document.createElement("style");
  style.id = "position-widget-dropdown-global-style";
  style.textContent = `
    .position-widget-dropdown-panel {
      background: #ffffff;
      border: 1px solid #cfd9e3;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(34,53,72,0.18);
      overflow: hidden;
      min-width: 220px;
      max-width: 380px;
      max-height: 340px;
      z-index: 999999;
      font-family: "72", Arial, sans-serif;
    }
    .position-widget-dropdown-panel .dropdown-search-wrap {
      padding: 8px;
      border-bottom: 1px solid #e8eef5;
      background: #ffffff;
    }
    .position-widget-dropdown-panel .dropdown-search-input {
      width: 100%;
      height: 32px;
      border: 1px solid #b9cae0;
      border-radius: 6px;
      padding: 0 10px;
      box-sizing: border-box;
      font-size: 13px;
      outline: none;
      color: #223548;
    }
    .position-widget-dropdown-panel .dropdown-search-input:focus {
      border-color: #0a6ed1;
      box-shadow: 0 0 0 2px rgba(10,110,209,0.12);
    }
    .position-widget-dropdown-panel .dropdown-list {
      max-height: 280px;
      overflow: auto;
      background: #ffffff;
    }
    .position-widget-dropdown-panel .dropdown-item {
      padding: 9px 10px;
      font-size: 13px;
      color: #223548;
      cursor: pointer;
      border-bottom: 1px solid #f3f6f9;
      line-height: 1.35;
      word-break: break-word;
    }
    .position-widget-dropdown-panel .dropdown-item:hover {
      background: #edf5ff;
    }
    .position-widget-dropdown-panel .dropdown-item.selected {
      background: #e8f2ff;
      color: #0a6ed1;
      font-weight: 600;
    }
    .position-widget-dropdown-panel .dropdown-empty {
      padding: 12px;
      color: #7b8a9a;
      text-align: center;
      font-size: 13px;
    }
  `;
  document.head.appendChild(style);
})();
*/


class PositionEntryWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._activeTab = "create";

    this._rows = [];
    this._manageRows = [];

    this._options = {
      companyCode: [],
      division: [],
      department: [],
      costCenter: [],
      jobCode: [],
      payGradeGroup: [],
      payGradeLevel: [],
      nationality: [],
      accommodation: [],
      transport: [],
      employeeClass: [],
      overtime: [],
      specialApproval: []
    };

    this._rowOptions = {};
    this._manageRowOptions = {};

    this._lastEvent = "";
    this._sendPayload = "";
    this._validationResult = "true";
    this._validationErrors = [];
    this._suspendAttributeSync = false;

    this._dropdownPanel = null;
    this._dropdownSearch = null;
    this._dropdownList = null;
    this._dropdownOpen = false;
    this._activeDropdownTrigger = null;
    this._activeDropdownTab = "create";
    this._activeDropdownRow = -1;
    this._activeDropdownField = "";
    this._activeDropdownOptions = [];
    this._activeDropdownSelectedKey = "";

    this._createColumns = [
      { key: "selected", label: "Sel", type: "checkbox", width: "60px" },
      { key: "companyCode", label: "Company Code", type: "select", width: "160px" },
      { key: "division", label: "Division", type: "select", width: "180px" },
      { key: "department", label: "Department", type: "select", width: "190px" },
      { key: "costCenter", label: "Cost Center", type: "select", width: "190px" },
      { key: "jobCode", label: "Job Code", type: "select", width: "190px" },
      { key: "positionTitle", label: "Position Title", type: "text", width: "220px" },
      { key: "employeeId", label: "Employee ID", type: "text", width: "170px" },
      { key: "payGradeGroup", label: "Pay Grade", type: "select", width: "130px" },
      { key: "payGradeLevel", label: "Level", type: "select", width: "110px" },
      { key: "hireDate", label: "Hire Date", type: "date", width: "150px" },
      { key: "nationality", label: "Nationality", type: "select", width: "160px" },
      { key: "accommodation", label: "Accommodation", type: "select", width: "160px" },
      { key: "transport", label: "Transport", type: "select", width: "150px" },
      { key: "employeeClass", label: "Employee Class", type: "select", width: "160px" },
      { key: "overtime", label: "Overtime", type: "select", width: "130px" },
      { key: "specialApproval", label: "Special Approval", type: "select", width: "170px" },
      { key: "comment", label: "Comment", type: "text", width: "260px" }
    ];

    this._manageColumns = [
      { key: "selected", label: "Sel", type: "checkbox", width: "60px" },
      { key: "employeeId", label: "Employee ID", type: "readonly", width: "170px" },
      { key: "companyCode", label: "Company Code", type: "select", width: "160px" },
      { key: "division", label: "Division", type: "select", width: "180px" },
      { key: "department", label: "Department", type: "select", width: "190px" },
      { key: "costCenter", label: "Cost Center", type: "select", width: "190px" },
      { key: "jobCode", label: "Job Code", type: "select", width: "190px" },
      { key: "positionTitle", label: "Position Title", type: "text", width: "220px" },
      { key: "payGradeGroup", label: "Pay Grade", type: "select", width: "130px" },
      { key: "payGradeLevel", label: "Level", type: "select", width: "110px" },
      { key: "hireDate", label: "Hire Date", type: "date", width: "150px" },
      { key: "nationality", label: "Nationality", type: "select", width: "160px" },
      { key: "accommodation", label: "Accommodation", type: "select", width: "160px" },
      { key: "transport", label: "Transport", type: "select", width: "150px" },
      { key: "employeeClass", label: "Employee Class", type: "select", width: "160px" },
      { key: "overtime", label: "Overtime", type: "select", width: "130px" },
      { key: "specialApproval", label: "Special Approval", type: "select", width: "170px" },
      { key: "comment", label: "Comment", type: "text", width: "260px" }
    ];
  }

  connectedCallback() {
    if (!this._rows.length) {
      this._rows = [this._createEmptyRow(1)];
    }
    this._createDropdownPanel();
    this._render();
    this._fireReady();
  }

  disconnectedCallback() {
    this._closeDropdown();
    if (this._dropdownPanel && this._dropdownPanel.parentNode) {
      this._dropdownPanel.parentNode.removeChild(this._dropdownPanel);
    }
    this._dropdownPanel = null;
  }

  static get observedAttributes() {
    return ["data", "managedata", "activetab", "lastevent", "validationresult", "validationerrors", "sendforapprovalpayload"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || this._suspendAttributeSync) {
      return;
    }

    if (name === "data") {
      try {
        var parsedData = JSON.parse(newValue || "[]");
        if (Array.isArray(parsedData)) {
          this._rows = parsedData.length ? parsedData : [this._createEmptyRow(1)];
          this._syncRowIds();
          this._render();
        }
      } catch (e) {}
    }

    if (name === "managedata") {
      try {
        var parsedManage = JSON.parse(newValue || "[]");
        if (Array.isArray(parsedManage)) {
          this._manageRows = parsedManage;
          this._syncManageRowIds();
          this._render();
        }
      } catch (e2) {}
    }

    if (name === "activetab") {
      this._activeTab = newValue || "create";
      this._render();
    }
  }

  getData() {
    var outText = "";
    var rowLoop = 0;

    for (rowLoop = 0; rowLoop < this._rows.length; rowLoop++) {
      var dataRow = this._rows[rowLoop];

      if (outText !== "") {
        outText = outText + "||";
      }

      outText = outText
        + "rowId::" + this._safeValue(dataRow.rowId) + "~~"
        + "selected::" + this._safeValue(dataRow.selected ? "true" : "false") + "~~"
        + "companyCode::" + this._safeValue(dataRow.companyCode) + "~~"
        + "division::" + this._safeValue(dataRow.division) + "~~"
        + "department::" + this._safeValue(dataRow.department) + "~~"
        + "costCenter::" + this._safeValue(dataRow.costCenter) + "~~"
        + "jobCode::" + this._safeValue(dataRow.jobCode) + "~~"
        + "positionTitle::" + this._safeValue(dataRow.positionTitle) + "~~"
        + "employeeId::" + this._safeValue(dataRow.employeeId) + "~~"
        + "payGradeGroup::" + this._safeValue(dataRow.payGradeGroup) + "~~"
        + "payGradeLevel::" + this._safeValue(dataRow.payGradeLevel) + "~~"
        + "hireDate::" + this._safeValue(dataRow.hireDate) + "~~"
        + "nationality::" + this._safeValue(dataRow.nationality) + "~~"
        + "accommodation::" + this._safeValue(dataRow.accommodation) + "~~"
        + "transport::" + this._safeValue(dataRow.transport) + "~~"
        + "employeeClass::" + this._safeValue(dataRow.employeeClass) + "~~"
        + "overtime::" + this._safeValue(dataRow.overtime) + "~~"
        + "specialApproval::" + this._safeValue(dataRow.specialApproval) + "~~"
        + "comment::" + this._safeValue(dataRow.comment);
    }

    return outText;
  }

  getManageData() {
    return JSON.stringify(this._manageRows || []);
  }

  getLastEvent() {
    return this._lastEvent || "";
  }

  getSendForApprovalPayload() {
    return this._sendPayload || "";
  }

  getValidationErrors() {
    return JSON.stringify(this._validationErrors || []);
  }

  getValidationResult() {
    return this._validationResult || "false";
  }

  setActiveTab(tabName) {
    if (tabName !== "create" && tabName !== "manage") {
      tabName = "create";
    }
    this._activeTab = tabName;
    this._setProperties();
    this._render();
  }

  setData(dataStr) {
    try {
      var parsedRows = JSON.parse(dataStr || "[]");
      if (Array.isArray(parsedRows) && parsedRows.length > 0) {
        this._rows = parsedRows;
      } else {
        this._rows = [this._createEmptyRow(1)];
      }
    } catch (e) {
      this._rows = [this._createEmptyRow(1)];
    }

    this._syncRowIds();
    this._setDataProperty();
    this._render();
  }

  setManageData(dataStr) {
    try {
      var parsedManageRows = JSON.parse(dataStr || "[]");
      if (Array.isArray(parsedManageRows)) {
        this._manageRows = parsedManageRows;
      } else {
        this._manageRows = [];
      }
    } catch (e) {
      this._manageRows = [];
    }

    this._syncManageRowIds();
    this._setManageDataProperty();
    this._render();
  }

  setOptions(fieldName, optionsStr) {
    try {
      var optionsArray = JSON.parse(optionsStr || "[]");
      if (!Array.isArray(optionsArray)) {
        optionsArray = [];
      }
      this._options[fieldName] = optionsArray;
      this._render();
    } catch (e) {}
  }

  setRowOptions(rowIndex, fieldName, optionsStr) {
    try {
      var optionsRowArray = JSON.parse(optionsStr || "[]");
      if (!Array.isArray(optionsRowArray)) {
        optionsRowArray = [];
      }

      if (!this._rowOptions[rowIndex]) {
        this._rowOptions[rowIndex] = {};
      }

      this._rowOptions[rowIndex][fieldName] = optionsRowArray;
      this._render();
    } catch (e) {}
  }

  setManageRowOptions(rowIndex, fieldName, optionsStr) {
    try {
      var optionsManageArray = JSON.parse(optionsStr || "[]");
      if (!Array.isArray(optionsManageArray)) {
        optionsManageArray = [];
      }

      if (!this._manageRowOptions[rowIndex]) {
        this._manageRowOptions[rowIndex] = {};
      }

      this._manageRowOptions[rowIndex][fieldName] = optionsManageArray;
      this._render();
    } catch (e) {}
  }

  setCellValue(rowIndex, fieldName, value) {
    if (!this._rows[rowIndex]) {
      return;
    }

    this._rows[rowIndex][fieldName] = value;
    this._setDataProperty();
    this._render();
  }

  setManageCellValue(rowIndex, fieldName, value) {
    if (!this._manageRows[rowIndex]) {
      return;
    }

    this._manageRows[rowIndex][fieldName] = value;
    this._manageRows[rowIndex].isModified = true;
    this._setManageDataProperty();
    this._render();
  }

  addRow() {
    var newRowId = this._rows.length + 1;
    this._rows.push(this._createEmptyRow(newRowId));
    this._syncRowIds();
    this._setDataProperty();
    this._render();
    this._dispatch("onDataChange");
  }

  copySelectedRows() {
    var copiedCreateRows = [];
    var copiedOptionsMap = {};
    var companyEventsCopy = [];
    var copyLoop = 0;

    for (copyLoop = 0; copyLoop < this._rows.length; copyLoop++) {
      if (this._rows[copyLoop].selected === true) {
        var copySource = this._rows[copyLoop];
        var copyIndex = this._rows.length + copiedCreateRows.length;

        var copiedRowObject = {
          rowId: copyIndex + 1,
          selected: false,
          companyCode: copySource.companyCode || "",
          division: copySource.division || "",
          department: copySource.department || "",
          costCenter: copySource.costCenter || "",
          jobCode: copySource.jobCode || "",
          positionTitle: copySource.positionTitle || "",
          employeeId: "",
          payGradeGroup: copySource.payGradeGroup || "",
          payGradeLevel: copySource.payGradeLevel || "",
          hireDate: copySource.hireDate || "",
          nationality: copySource.nationality || "",
          accommodation: copySource.accommodation || "Yes",
          transport: copySource.transport || "Yes",
          employeeClass: copySource.employeeClass || "Regular",
          overtime: copySource.overtime || "Yes",
          specialApproval: copySource.specialApproval || "No",
          comment: copySource.comment || ""
        };

        copiedCreateRows.push(copiedRowObject);

        if (this._rowOptions[copyLoop]) {
          copiedOptionsMap[copyIndex] = JSON.parse(JSON.stringify(this._rowOptions[copyLoop]));
        }

        companyEventsCopy.push({
          rowIndex: copyIndex,
          companyCode: copySource.companyCode || ""
        });
      }
    }

    if (copiedCreateRows.length === 0) {
      return;
    }

    for (copyLoop = 0; copyLoop < copiedCreateRows.length; copyLoop++) {
      this._rows.push(copiedCreateRows[copyLoop]);
    }

    for (var copyKey in copiedOptionsMap) {
      if (Object.prototype.hasOwnProperty.call(copiedOptionsMap, copyKey)) {
        this._rowOptions[copyKey] = copiedOptionsMap[copyKey];
      }
    }

    this._syncRowIds();
    this._validationErrors = [];
    this._validationResult = "true";
    this._setProperties();
    this._render();

    for (copyLoop = 0; copyLoop < companyEventsCopy.length; copyLoop++) {
      if (companyEventsCopy[copyLoop].companyCode !== "") {
        this._fireFieldChange(companyEventsCopy[copyLoop].rowIndex, "companyCode", companyEventsCopy[copyLoop].companyCode);
      }
    }
  }

  clear() {
    if (this._activeTab === "manage") {
      this._manageRows = [];
      this._manageRowOptions = {};
      this._lastEvent = "clearManage";
    } else {
      this._rows = [this._createEmptyRow(1)];
      this._rowOptions = {};
      this._sendPayload = "";
      this._lastEvent = "clear";
    }

    this._validationErrors = [];
    this._validationResult = "true";
    this._setProperties();
    this._render();
    this._dispatch("onDataChange");
  }

  clearRowsAfterSend() {
    this._rows = [this._createEmptyRow(1)];
    this._rowOptions = {};
    this._validationErrors = [];
    this._validationResult = "true";
    this._lastEvent = "clearAfterSend";
    this._sendPayload = "";
    this._setProperties();
    this._render();
  }

  validate() {
    var validateResult = this._activeTab === "manage" ? this._validateManageRows() : this._validateCreateRows();
    this._validationErrors = validateResult.errors;
    this._validationResult = validateResult.isValid ? "true" : "false";
    this._lastEvent = this._activeTab === "manage" ? "validateManage" : "validateOnly";
    this._setProperties();
    this._render();
    this._dispatch("onValidate");
    return this._validationResult;
  }

  loadManageData() {
    this._lastEvent = "loadManage";
    this._setProperties();
    this._dispatch("onDataChange");
  }

  saveManageData() {
    this._lastEvent = "saveManage";
    this._setProperties();
    this._dispatch("onDataChange");
  }

  deleteManageData() {
    this._lastEvent = "deleteManage";
    this._setProperties();
    this._dispatch("onDataChange");
  }

  _createEmptyRow(rowId) {
    return {
      rowId: rowId,
      selected: false,
      companyCode: "",
      division: "",
      department: "",
      costCenter: "",
      jobCode: "",
      positionTitle: "",
      employeeId: "",
      payGradeGroup: "",
      payGradeLevel: "",
      hireDate: "",
      nationality: "",
      accommodation: "Yes",
      transport: "Yes",
      employeeClass: "Regular",
      overtime: "Yes",
      specialApproval: "No",
      comment: ""
    };
  }

  _safeValue(value) {
    if (value === undefined || value === null) {
      return "";
    }

    return String(value)
      .replace(/\|\|/g, " ")
      .replace(/~~/g, " ")
      .replace(/::/g, " ");
  }

  _syncRowIds() {
    var syncLoop = 0;
    for (syncLoop = 0; syncLoop < this._rows.length; syncLoop++) {
      this._rows[syncLoop].rowId = syncLoop + 1;
      if (this._rows[syncLoop].selected === undefined) {
        this._rows[syncLoop].selected = false;
      }
    }
  }

  _syncManageRowIds() {
    var syncManageLoop = 0;
    for (syncManageLoop = 0; syncManageLoop < this._manageRows.length; syncManageLoop++) {
      this._manageRows[syncManageLoop].rowId = syncManageLoop + 1;
      if (this._manageRows[syncManageLoop].selected === undefined) {
        this._manageRows[syncManageLoop].selected = false;
      }
      if (this._manageRows[syncManageLoop].isModified === undefined) {
        this._manageRows[syncManageLoop].isModified = false;
      }
    }
  }

  _getOptionsForCell(tabName, rowIndex, fieldName) {
    var sourceRowOptions = tabName === "manage" ? this._manageRowOptions : this._rowOptions;

    if (
      sourceRowOptions[rowIndex] &&
      sourceRowOptions[rowIndex][fieldName] &&
      Array.isArray(sourceRowOptions[rowIndex][fieldName])
    ) {
      return sourceRowOptions[rowIndex][fieldName];
    }

    return this._options[fieldName] || [];
  }

  _getOptionText(tabName, rowIndex, fieldName, value) {
    var optionList = this._getOptionsForCell(tabName, rowIndex, fieldName);
    var optionLoop = 0;

    for (optionLoop = 0; optionLoop < optionList.length; optionLoop++) {
      if (String(optionList[optionLoop].key) === String(value)) {
        return optionList[optionLoop].text !== undefined ? optionList[optionLoop].text : optionList[optionLoop].key;
      }
    }

    return "";
  }

  _setProperties() {
    this._setAllDataProperties();
    this._suspendAttributeSync = true;
    this.setAttribute("activetab", this._activeTab || "create");
    this.setAttribute("lastevent", this._lastEvent || "");
    this.setAttribute("validationresult", this._validationResult || "true");
    this.setAttribute("validationerrors", JSON.stringify(this._validationErrors || []));
    this.setAttribute("sendforapprovalpayload", this._sendPayload || "");
    this._suspendAttributeSync = false;
  }

  _setDataProperty() {
    this._suspendAttributeSync = true;
    this.setAttribute("data", JSON.stringify(this._rows));
    this._suspendAttributeSync = false;
  }

  _setManageDataProperty() {
    this._suspendAttributeSync = true;
    this.setAttribute("managedata", JSON.stringify(this._manageRows));
    this._suspendAttributeSync = false;
  }

  _setAllDataProperties() {
    this._setDataProperty();
    this._setManageDataProperty();
  }

  _dispatch(name) {
    this.dispatchEvent(new CustomEvent(name, {
      detail: {}
    }));
  }

  _fireReady() {
    this._lastEvent = "ready";
    this._setProperties();
    this._dispatch("onReady");
  }

  _fireFieldChange(rowIndex, fieldName, value) {
    this._lastEvent = "fieldChange|" + String(rowIndex) + "|" + String(fieldName) + "|" + String(value);
    this._setProperties();
    this._dispatch("onDataChange");
  }

  _fireManageFieldChange(rowIndex, fieldName, value) {
    this._lastEvent = "manageFieldChange|" + String(rowIndex) + "|" + String(fieldName) + "|" + String(value);
    this._setProperties();
    this._dispatch("onDataChange");
  }

  _deleteSelectedRows() {
    if (this._activeTab === "manage") {
      this.deleteManageData();
      return;
    }

    var remainingRows = [];
    var deleteLoop = 0;

    for (deleteLoop = 0; deleteLoop < this._rows.length; deleteLoop++) {
      if (this._rows[deleteLoop].selected !== true) {
        remainingRows.push(this._rows[deleteLoop]);
      }
    }

    if (!remainingRows.length) {
      remainingRows = [this._createEmptyRow(1)];
    }

    this._rows = remainingRows;
    this._syncRowIds();
    this._validationErrors = [];
    this._validationResult = "true";
    this._setProperties();
    this._render();
    this._dispatch("onDataChange");
  }

  _validateCreateRows() {
    var errorListCreate = [];
    var employeeMapCreate = {};
    var validateLoopCreate = 0;

    for (validateLoopCreate = 0; validateLoopCreate < this._rows.length; validateLoopCreate++) {
      var createCheckRow = this._rows[validateLoopCreate];

      if (createCheckRow.employeeId && createCheckRow.employeeId !== "") {
        if (!employeeMapCreate[createCheckRow.employeeId]) {
          employeeMapCreate[createCheckRow.employeeId] = 1;
        } else {
          employeeMapCreate[createCheckRow.employeeId] = employeeMapCreate[createCheckRow.employeeId] + 1;
        }
      }
    }

    for (validateLoopCreate = 0; validateLoopCreate < this._rows.length; validateLoopCreate++) {
      var createRowErrors = [];
      var createValidateRow = this._rows[validateLoopCreate];

      if (!createValidateRow.companyCode) { createRowErrors.push("Company Code is required"); }
      if (!createValidateRow.division) { createRowErrors.push("Division is required"); }
      if (!createValidateRow.department) { createRowErrors.push("Department is required"); }
      if (!createValidateRow.costCenter) { createRowErrors.push("Cost Center is required"); }
      if (!createValidateRow.jobCode) { createRowErrors.push("Job Code is required"); }
      if (!createValidateRow.positionTitle) { createRowErrors.push("Position Title is required"); }
      if (!createValidateRow.employeeId) { createRowErrors.push("Employee ID is required"); }
      if (!createValidateRow.hireDate) { createRowErrors.push("Hire Date is required"); }

      if (createValidateRow.employeeId && employeeMapCreate[createValidateRow.employeeId] > 1) {
        createRowErrors.push("Duplicate Employee ID in widget rows");
      }

      if (createValidateRow.specialApproval === "Yes" && !createValidateRow.comment) {
        createRowErrors.push("Comment is required when Special Approval = Yes");
      }

      if (createRowErrors.length > 0) {
        errorListCreate.push({
          tab: "create",
          rowIndex: validateLoopCreate,
          rowId: createValidateRow.rowId,
          messages: createRowErrors
        });
      }
    }

    return {
      isValid: errorListCreate.length === 0,
      errors: errorListCreate
    };
  }

  _validateManageRows() {
    var errorListManage = [];
    var employeeMapManage = {};
    var validateLoopManage = 0;

    for (validateLoopManage = 0; validateLoopManage < this._manageRows.length; validateLoopManage++) {
      var manageCheckRow = this._manageRows[validateLoopManage];

      if (manageCheckRow.employeeId && manageCheckRow.employeeId !== "") {
        if (!employeeMapManage[manageCheckRow.employeeId]) {
          employeeMapManage[manageCheckRow.employeeId] = 1;
        } else {
          employeeMapManage[manageCheckRow.employeeId] = employeeMapManage[manageCheckRow.employeeId] + 1;
        }
      }
    }

    for (validateLoopManage = 0; validateLoopManage < this._manageRows.length; validateLoopManage++) {
      var manageRowErrors = [];
      var manageValidateRow = this._manageRows[validateLoopManage];

      if (!manageValidateRow.employeeId) { manageRowErrors.push("Employee ID is required"); }
      if (!manageValidateRow.companyCode) { manageRowErrors.push("Company Code is required"); }
      if (!manageValidateRow.division) { manageRowErrors.push("Division is required"); }
      if (!manageValidateRow.department) { manageRowErrors.push("Department is required"); }
      if (!manageValidateRow.costCenter) { manageRowErrors.push("Cost Center is required"); }
      if (!manageValidateRow.jobCode) { manageRowErrors.push("Job Code is required"); }
      if (!manageValidateRow.positionTitle) { manageRowErrors.push("Position Title is required"); }
      if (!manageValidateRow.hireDate) { manageRowErrors.push("Hire Date is required"); }

      if (manageValidateRow.employeeId && employeeMapManage[manageValidateRow.employeeId] > 1) {
        manageRowErrors.push("Duplicate Employee ID in manage rows");
      }

      if (manageValidateRow.specialApproval === "Yes" && !manageValidateRow.comment) {
        manageRowErrors.push("Comment is required when Special Approval = Yes");
      }

      if (manageRowErrors.length > 0) {
        errorListManage.push({
          tab: "manage",
          rowIndex: validateLoopManage,
          rowId: manageValidateRow.rowId,
          messages: manageRowErrors
        });
      }
    }

    return {
      isValid: errorListManage.length === 0,
      errors: errorListManage
    };
  }

  _getRowErrorMap(tabName) {
    var errorMap = {};
    var errorLoop = 0;

    for (errorLoop = 0; errorLoop < this._validationErrors.length; errorLoop++) {
      if ((this._validationErrors[errorLoop].tab || "create") === tabName) {
        errorMap[this._validationErrors[errorLoop].rowIndex] = this._validationErrors[errorLoop].messages;
      }
    }

    return errorMap;
  }

  _countErrorRows(tabName) {
    var errorCount = 0;
    var errorCountLoop = 0;

    for (errorCountLoop = 0; errorCountLoop < this._validationErrors.length; errorCountLoop++) {
      if ((this._validationErrors[errorCountLoop].tab || "create") === tabName) {
        errorCount = errorCount + 1;
      }
    }

    return errorCount;
  }

  _createDropdownPanel() {
    if (this._dropdownPanel) {
      return;
    }

    var dropdownPanel = document.createElement("div");
    dropdownPanel.className = "position-widget-dropdown-panel";
    dropdownPanel.style.display = "none";

    dropdownPanel.innerHTML =
      '<div class="dropdown-search-wrap">' +
        '<input type="text" class="dropdown-search-input" placeholder="Search..." />' +
      '</div>' +
      '<div class="dropdown-list"></div>';

    document.body.appendChild(dropdownPanel);

    this._dropdownPanel = dropdownPanel;
    this._dropdownSearch = dropdownPanel.querySelector(".dropdown-search-input");
    this._dropdownList = dropdownPanel.querySelector(".dropdown-list");

    var panelThat = this;

    this._dropdownSearch.addEventListener("input", function() {
      panelThat._renderDropdownItems(this.value);
    });

    this._documentClickHandler = function(e) {
      if (!panelThat._dropdownOpen) {
        return;
      }

      var insidePanel = panelThat._dropdownPanel && panelThat._dropdownPanel.contains(e.target);
      var insideTrigger = panelThat._activeDropdownTrigger && panelThat._activeDropdownTrigger.contains(e.target);

      if (!insidePanel && !insideTrigger) {
        panelThat._closeDropdown();
      }
    };

    document.addEventListener("click", this._documentClickHandler);
  }

  _openDropdown(triggerEl, tabName, rowIndex, fieldName) {
    this._createDropdownPanel();

    this._activeDropdownTrigger = triggerEl;
    this._activeDropdownTab = tabName;
    this._activeDropdownRow = rowIndex;
    this._activeDropdownField = fieldName;
    this._activeDropdownOptions = this._getOptionsForCell(tabName, rowIndex, fieldName) || [];
    this._activeDropdownSelectedKey = tabName === "manage"
      ? (this._manageRows[rowIndex] ? this._manageRows[rowIndex][fieldName] : "")
      : (this._rows[rowIndex] ? this._rows[rowIndex][fieldName] : "");

    var triggerRect = triggerEl.getBoundingClientRect();
    var dropdownWidth = Math.max(triggerRect.width, 260);
    var dropdownTop = triggerRect.bottom + 4;
    var dropdownLeft = triggerRect.left;

    if (dropdownLeft + dropdownWidth > window.innerWidth - 10) {
      dropdownLeft = window.innerWidth - dropdownWidth - 10;
    }
    if (dropdownLeft < 10) {
      dropdownLeft = 10;
    }

    this._dropdownPanel.style.display = "block";
    this._dropdownPanel.style.position = "fixed";
    this._dropdownPanel.style.left = dropdownLeft + "px";
    this._dropdownPanel.style.top = dropdownTop + "px";
    this._dropdownPanel.style.width = dropdownWidth + "px";
    this._dropdownPanel.style.zIndex = "999999";

    this._dropdownSearch.value = "";
    this._renderDropdownItems("");
    this._dropdownOpen = true;

    var openThat = this;
    setTimeout(function() {
      if (openThat._dropdownSearch) {
        openThat._dropdownSearch.focus();
      }
    }, 0);
  }

  _closeDropdown() {
    if (this._dropdownPanel) {
      this._dropdownPanel.style.display = "none";
    }

    this._dropdownOpen = false;
    this._activeDropdownTrigger = null;
    this._activeDropdownTab = "create";
    this._activeDropdownRow = -1;
    this._activeDropdownField = "";
    this._activeDropdownOptions = [];
    this._activeDropdownSelectedKey = "";
  }

  _renderDropdownItems(searchText) {
    if (!this._dropdownList) {
      return;
    }

    var renderThat = this;
    var searchValue = String(searchText || "").toLowerCase().trim();
    var itemSource = this._activeDropdownOptions || [];
    var filteredItems = [];
    var itemLoop = 0;

    for (itemLoop = 0; itemLoop < itemSource.length; itemLoop++) {
      var itemKey = itemSource[itemLoop].key !== undefined ? String(itemSource[itemLoop].key) : "";
      var itemText = itemSource[itemLoop].text !== undefined ? String(itemSource[itemLoop].text) : itemKey;
      var itemSearchText = (itemKey + " " + itemText).toLowerCase();

      if (searchValue === "" || itemSearchText.indexOf(searchValue) > -1) {
        filteredItems.push({
          key: itemKey,
          text: itemText
        });
      }
    }

    this._dropdownList.innerHTML = "";

    if (filteredItems.length === 0) {
      this._dropdownList.innerHTML = '<div class="dropdown-empty">No results found</div>';
      return;
    }

    for (itemLoop = 0; itemLoop < filteredItems.length; itemLoop++) {
      var dropdownItem = document.createElement("div");
      dropdownItem.className = "dropdown-item";

      if (String(filteredItems[itemLoop].key) === String(this._activeDropdownSelectedKey)) {
        dropdownItem.className += " selected";
      }

      dropdownItem.textContent = filteredItems[itemLoop].text;
      dropdownItem.setAttribute("data-key", filteredItems[itemLoop].key);

      dropdownItem.addEventListener("mousedown", function(e) {
        e.preventDefault();

        var selectedKeyValue = this.getAttribute("data-key");

        if (renderThat._activeDropdownTab === "manage") {
          renderThat._manageRows[renderThat._activeDropdownRow][renderThat._activeDropdownField] = selectedKeyValue;
          renderThat._manageRows[renderThat._activeDropdownRow].isModified = true;
          renderThat._validationErrors = [];
          renderThat._validationResult = "true";
          renderThat._setProperties();
          renderThat._render();
          renderThat._fireManageFieldChange(renderThat._activeDropdownRow, renderThat._activeDropdownField, selectedKeyValue);
        } else {
          renderThat._rows[renderThat._activeDropdownRow][renderThat._activeDropdownField] = selectedKeyValue;
          renderThat._validationErrors = [];
          renderThat._validationResult = "true";
          renderThat._setProperties();
          renderThat._render();
          renderThat._fireFieldChange(renderThat._activeDropdownRow, renderThat._activeDropdownField, selectedKeyValue);
        }

        renderThat._closeDropdown();
      });

      this._dropdownList.appendChild(dropdownItem);
    }
  }

  _render() {
    var rowErrorMapCreate = this._getRowErrorMap("create");
    var rowErrorMapManage = this._getRowErrorMap("manage");

    var styleHtml =
      '<style>' +
        ':host { display:block; font-family:"72", Arial, sans-serif; color:#223548; }' +
        '.wrap { border:1px solid #d9e2ef; border-radius:12px; background:#ffffff; overflow:hidden; }' +
        '.tabbar { display:flex; gap:0; border-bottom:1px solid #dfe8f2; background:#f8fbff; }' +
        '.tabbtn { border:none; background:transparent; padding:14px 18px; cursor:pointer; font-weight:700; font-size:13px; color:#5d7288; border-bottom:3px solid transparent; }' +
        '.tabbtn.active { color:#0a6ed1; border-bottom-color:#0a6ed1; background:#ffffff; }' +
        '.toolbar { display:flex; justify-content:flex-end; gap:8px; padding:12px; border-bottom:1px solid #e5edf7; background:#f8fbff; }' +
        '.btn { border:1px solid #c7d7ea; background:#ffffff; color:#0a6ed1; border-radius:8px; padding:8px 14px; cursor:pointer; font-weight:600; font-size:13px; }' +
        '.btn:hover { background:#f3f8fd; }' +
        '.btn.primary { background:#0a6ed1; color:#ffffff; border-color:#0a6ed1; }' +
        '.btn.danger { color:#bb1e1e; border-color:#efb4b4; background:#fff7f7; }' +
        '.gridWrap { overflow:auto; max-height:520px; background:#ffffff; }' +
        'table { border-collapse:separate; border-spacing:0; width:max-content; min-width:100%; }' +
        'th, td { border-bottom:1px solid #edf2f7; padding:8px; vertical-align:top; white-space:nowrap; }' +
        'th { position:sticky; top:0; background:#eef4fb; z-index:1; text-align:left; font-size:12px; color:#223548; font-weight:700; }' +
        'tr:hover td { background:#fafcff; }' +
        'tr.errorRow td { background:#fff7f7; }' +
        'tr.modifiedRow td { background:#fffbeb; }' +
        '.cell { width:100%; box-sizing:border-box; min-height:34px; height:34px; border:1px solid #c9d6e5; border-radius:6px; padding:6px 10px; font-size:13px; background:#fff; color:#223548; outline:none; }' +
        '.cell.error, .dropdown-trigger.error { border-color:#e25555; background:#fff5f5; }' +
        '.readonly-cell { width:100%; min-height:34px; height:34px; border:1px solid #d6dee8; border-radius:6px; padding:6px 10px; font-size:13px; background:#f6f8fb; color:#425466; box-sizing:border-box; display:flex; align-items:center; }' +
        '.rowErr { margin-top:4px; font-size:11px; color:#c53030; white-space:normal; max-width:240px; line-height:1.3; }' +
        '.summary { padding:10px 12px; border-top:1px solid #e5edf7; display:flex; gap:18px; font-size:12px; background:#fafcff; }' +
        '.dropdown-trigger { width:100%; min-height:34px; height:34px; border:1px solid #c9d6e5; border-radius:6px; background:#fff; display:flex; align-items:center; justify-content:space-between; box-sizing:border-box; padding:0 10px; cursor:pointer; font-size:13px; color:#223548; user-select:none; }' +
        '.dropdown-trigger .label { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:8px; }' +
        '.dropdown-trigger .arrow { color:#6a7f94; font-size:11px; flex:0 0 auto; }' +
      '</style>';

    var pageHtml = "";
    pageHtml += '<div class="wrap">';
    pageHtml += '<div class="tabbar">';
    pageHtml += '<button class="tabbtn ' + (this._activeTab === "create" ? "active" : "") + '" id="tabCreate">Tab 1 - Create Position</button>';
    pageHtml += '<button class="tabbtn ' + (this._activeTab === "manage" ? "active" : "") + '" id="tabManage">Tab 2 - Load / Modify / Delete</button>';
    pageHtml += '</div>';

    if (this._activeTab === "create") {
      pageHtml += '<div class="toolbar">';
      pageHtml += '<button class="btn" id="btnAdd">Add Row</button>';
      pageHtml += '<button class="btn" id="btnCopy">Copy</button>';
      pageHtml += '<button class="btn" id="btnDelete">Delete Selected</button>';
      pageHtml += '<button class="btn" id="btnValidate">Validate</button>';
      pageHtml += '<button class="btn primary" id="btnSendForApproval">Send for Approval</button>';
      pageHtml += '<button class="btn" id="btnClear">Clear</button>';
      pageHtml += '</div>';

      pageHtml += '<div class="gridWrap" id="gridWrap">';
      pageHtml += '<table><thead><tr>';

      var createHeaderLoop = 0;
      for (createHeaderLoop = 0; createHeaderLoop < this._createColumns.length; createHeaderLoop++) {
        pageHtml += '<th style="width:' + this._createColumns[createHeaderLoop].width + '">' + this._createColumns[createHeaderLoop].label + '</th>';
      }

      pageHtml += '</tr></thead><tbody>';

      var createRowLoop = 0;
      for (createRowLoop = 0; createRowLoop < this._rows.length; createRowLoop++) {
        var createRowErrors = rowErrorMapCreate[createRowLoop] || [];
        pageHtml += '<tr class="' + (createRowErrors.length ? "errorRow" : "") + '">';

        var createCellLoop = 0;
        for (createCellLoop = 0; createCellLoop < this._createColumns.length; createCellLoop++) {
          pageHtml += '<td style="width:' + this._createColumns[createCellLoop].width + '">' + this._renderCell("create", this._rows[createRowLoop], createRowLoop, this._createColumns[createCellLoop], createRowErrors) + '</td>';
        }

        pageHtml += '</tr>';
      }

      pageHtml += '</tbody></table></div>';
      pageHtml += '<div class="summary">';
      pageHtml += '<div>Total Rows: ' + this._rows.length + '</div>';
      pageHtml += '<div>Validation: ' + this._validationResult + '</div>';
      pageHtml += '<div>Error Rows: ' + this._countErrorRows("create") + '</div>';
      pageHtml += '</div>';
    } else {
      pageHtml += '<div class="toolbar">';
      pageHtml += '<button class="btn" id="btnLoadManage">Load Data</button>';
      pageHtml += '<button class="btn" id="btnValidateManage">Validate</button>';
      pageHtml += '<button class="btn primary" id="btnSaveManage">Save Changes</button>';
      pageHtml += '<button class="btn danger" id="btnDeleteManage">Delete Selected</button>';
      pageHtml += '<button class="btn" id="btnClearManage">Clear</button>';
      pageHtml += '</div>';

      pageHtml += '<div class="gridWrap" id="gridWrap">';
      pageHtml += '<table><thead><tr>';

      var manageHeaderLoop = 0;
      for (manageHeaderLoop = 0; manageHeaderLoop < this._manageColumns.length; manageHeaderLoop++) {
        pageHtml += '<th style="width:' + this._manageColumns[manageHeaderLoop].width + '">' + this._manageColumns[manageHeaderLoop].label + '</th>';
      }

      pageHtml += '</tr></thead><tbody>';

      var manageRowLoop = 0;
      for (manageRowLoop = 0; manageRowLoop < this._manageRows.length; manageRowLoop++) {
        var manageRowErrors = rowErrorMapManage[manageRowLoop] || [];
        var manageRowClass = "";

        if (manageRowErrors.length) {
          manageRowClass = "errorRow";
        } else if (this._manageRows[manageRowLoop].isModified === true) {
          manageRowClass = "modifiedRow";
        }

        pageHtml += '<tr class="' + manageRowClass + '">';

        var manageCellLoop = 0;
        for (manageCellLoop = 0; manageCellLoop < this._manageColumns.length; manageCellLoop++) {
          pageHtml += '<td style="width:' + this._manageColumns[manageCellLoop].width + '">' + this._renderCell("manage", this._manageRows[manageRowLoop], manageRowLoop, this._manageColumns[manageCellLoop], manageRowErrors) + '</td>';
        }

        pageHtml += '</tr>';
      }

      pageHtml += '</tbody></table></div>';
      pageHtml += '<div class="summary">';
      pageHtml += '<div>Total Rows: ' + this._manageRows.length + '</div>';
      pageHtml += '<div>Validation: ' + this._validationResult + '</div>';
      pageHtml += '<div>Error Rows: ' + this._countErrorRows("manage") + '</div>';
      pageHtml += '</div>';
    }

    pageHtml += '</div>';

    var oldGridPanel = this.shadowRoot.getElementById("gridWrap");
    var oldScrollLeft = oldGridPanel ? oldGridPanel.scrollLeft : 0;
    var oldScrollTop = oldGridPanel ? oldGridPanel.scrollTop : 0;

    this.shadowRoot.innerHTML = styleHtml + pageHtml;

    var newGridPanel = this.shadowRoot.getElementById("gridWrap");
    if (newGridPanel) {
      newGridPanel.scrollLeft = oldScrollLeft;
      newGridPanel.scrollTop = oldScrollTop;
    }

    this.shadowRoot.getElementById("tabCreate").addEventListener("click", this.setActiveTab.bind(this, "create"));
    this.shadowRoot.getElementById("tabManage").addEventListener("click", this.setActiveTab.bind(this, "manage"));

    if (this._activeTab === "create") {
      this.shadowRoot.getElementById("btnAdd").addEventListener("click", this.addRow.bind(this));
      this.shadowRoot.getElementById("btnCopy").addEventListener("click", this.copySelectedRows.bind(this));
      this.shadowRoot.getElementById("btnDelete").addEventListener("click", this._deleteSelectedRows.bind(this));
      this.shadowRoot.getElementById("btnValidate").addEventListener("click", this.validate.bind(this));

      this.shadowRoot.getElementById("btnSendForApproval").addEventListener("click", this._handleSendForApproval.bind(this));
      this.shadowRoot.getElementById("btnClear").addEventListener("click", this.clear.bind(this));
    }

    if (this._activeTab === "manage") {
      this.shadowRoot.getElementById("btnLoadManage").addEventListener("click", this.loadManageData.bind(this));
      this.shadowRoot.getElementById("btnValidateManage").addEventListener("click", this.validate.bind(this));
      this.shadowRoot.getElementById("btnSaveManage").addEventListener("click", this.saveManageData.bind(this));
      this.shadowRoot.getElementById("btnDeleteManage").addEventListener("click", this.deleteManageData.bind(this));
      this.shadowRoot.getElementById("btnClearManage").addEventListener("click", this.clear.bind(this));
    }

    this._bindCellEvents();
  }

  _handleSendForApproval() {
    var approvalValidation = this._validateCreateRows();
    this._validationErrors = approvalValidation.errors;
    this._validationResult = approvalValidation.isValid ? "true" : "false";
    this._setProperties();
    this._render();

    if (!approvalValidation.isValid) {
      this._lastEvent = "validationFailed";
      this._setProperties();
      this._dispatch("onValidate");
      return;
    }

    this._sendPayload = this.getData();
    this._lastEvent = "sendForApproval";
    this._setProperties();
    this._dispatch("onDataChange");
  }

  _renderCell(tabName, rowData, rowIndex, columnData, rowErrors) {
    var cellHasError = this._hasFieldError(columnData.key, rowErrors);
    var errorCss = cellHasError ? "error" : "";
    var cellValue = rowData[columnData.key] !== undefined && rowData[columnData.key] !== null ? rowData[columnData.key] : "";

    if (columnData.type === "checkbox") {
      return '<input class="cell ' + errorCss + '" data-tab="' + tabName + '" data-row="' + rowIndex + '" data-field="' + columnData.key + '" data-type="' + columnData.type + '" type="checkbox" ' + (cellValue === true ? "checked" : "") + ' />';
    }

    if (columnData.type === "readonly") {
      return '<div class="readonly-cell" data-tab="' + tabName + '" data-row="' + rowIndex + '" data-field="' + columnData.key + '" data-type="' + columnData.type + '">' + this._escapeHtml(String(cellValue)) + '</div>' + this._renderFieldErrors(columnData.key, rowErrors);
    }

    if (columnData.type === "select") {
      var displayText = this._getOptionText(tabName, rowIndex, columnData.key, cellValue);
      if (!displayText) {
        displayText = "Select";
      }

      return ''
        + '<div class="dropdown-trigger ' + errorCss + '" tabindex="0" data-tab="' + tabName + '" data-row="' + rowIndex + '" data-field="' + columnData.key + '" data-type="' + columnData.type + '">'
        + '<span class="label">' + this._escapeHtml(String(displayText)) + '</span>'
        + '<span class="arrow">▼</span>'
        + '</div>'
        + this._renderFieldErrors(columnData.key, rowErrors);
    }

    var inputTypeName = "text";
    if (columnData.type === "date") {
      inputTypeName = "date";
    } else if (columnData.type === "number") {
      inputTypeName = "number";
    }

    return ''
      + '<input class="cell ' + errorCss + '"'
      + ' data-tab="' + tabName + '"'
      + ' data-row="' + rowIndex + '"'
      + ' data-field="' + columnData.key + '"'
      + ' data-type="' + columnData.type + '"'
      + ' type="' + inputTypeName + '"'
      + ' value="' + this._escapeHtml(String(cellValue)) + '" />'
      + this._renderFieldErrors(columnData.key, rowErrors);
  }

  _renderFieldErrors(fieldName, rowErrors) {
    var errorMessages = [];
    var errorFieldLoop = 0;

    for (errorFieldLoop = 0; errorFieldLoop < rowErrors.length; errorFieldLoop++) {
      var fieldErrorText = rowErrors[errorFieldLoop];
      if (
        (fieldName === "companyCode" && fieldErrorText.indexOf("Company Code") === 0) ||
        (fieldName === "division" && fieldErrorText.indexOf("Division") === 0) ||
        (fieldName === "department" && fieldErrorText.indexOf("Department") === 0) ||
        (fieldName === "costCenter" && fieldErrorText.indexOf("Cost Center") === 0) ||
        (fieldName === "jobCode" && fieldErrorText.indexOf("Job Code") === 0) ||
        (fieldName === "positionTitle" && fieldErrorText.indexOf("Position Title") === 0) ||
        (fieldName === "employeeId" && (fieldErrorText.indexOf("Employee ID") === 0 || fieldErrorText.indexOf("Duplicate Employee ID") === 0)) ||
        (fieldName === "hireDate" && fieldErrorText.indexOf("Hire Date") === 0) ||
        (fieldName === "comment" && fieldErrorText.indexOf("Comment") === 0)
      ) {
        errorMessages.push(fieldErrorText);
      }
    }

    if (!errorMessages.length) {
      return "";
    }

    return '<div class="rowErr">' + errorMessages.join("<br>") + '</div>';
  }

  _hasFieldError(fieldName, rowErrors) {
    return this._renderFieldErrors(fieldName, rowErrors) !== "";
  }

  _bindCellEvents() {
    var bindThat = this;
    var allCellElements = this.shadowRoot.querySelectorAll("[data-row][data-field]");

    Array.prototype.forEach.call(allCellElements, function(el) {
      var elementType = el.getAttribute("data-type");
      var elementTab = el.getAttribute("data-tab");

      if (elementType === "checkbox") {
        el.addEventListener("change", function() {
          var changeRowIndex = parseInt(this.getAttribute("data-row"), 10);
          var changeFieldName = this.getAttribute("data-field");
          var changeValue = this.checked;

          if (elementTab === "manage") {
            bindThat._manageRows[changeRowIndex][changeFieldName] = changeValue;
            bindThat._manageRows[changeRowIndex].isModified = true;
            bindThat._validationErrors = [];
            bindThat._validationResult = "true";
            bindThat._setProperties();
            bindThat._fireManageFieldChange(changeRowIndex, changeFieldName, changeValue);
          } else {
            bindThat._rows[changeRowIndex][changeFieldName] = changeValue;
            bindThat._validationErrors = [];
            bindThat._validationResult = "true";
            bindThat._setProperties();
            bindThat._fireFieldChange(changeRowIndex, changeFieldName, changeValue);
          }
        });
        return;
      }

      if (elementType === "select") {
        el.addEventListener("click", function(e) {
          e.stopPropagation();
          var clickRowIndex = parseInt(this.getAttribute("data-row"), 10);
          var clickFieldName = this.getAttribute("data-field");
          bindThat._openDropdown(this, elementTab, clickRowIndex, clickFieldName);
        });

        el.addEventListener("keydown", function(e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            var keyRowIndex = parseInt(this.getAttribute("data-row"), 10);
            var keyFieldName = this.getAttribute("data-field");
            bindThat._openDropdown(this, elementTab, keyRowIndex, keyFieldName);
          }
        });
        return;
      }

      if (elementType === "readonly") {
        return;
      }

      el.addEventListener("input", function() {
        var inputRowIndex = parseInt(this.getAttribute("data-row"), 10);
        var inputFieldName = this.getAttribute("data-field");
        var inputValue = this.value;

        if (elementTab === "manage") {
          bindThat._manageRows[inputRowIndex][inputFieldName] = inputValue;
          bindThat._manageRows[inputRowIndex].isModified = true;
          bindThat._validationErrors = [];
          bindThat._validationResult = "true";
          bindThat._setManageDataProperty();
        } else {
          bindThat._rows[inputRowIndex][inputFieldName] = inputValue;
          bindThat._validationErrors = [];
          bindThat._validationResult = "true";
          bindThat._setDataProperty();
        }
      });

      el.addEventListener("change", function() {
        var finalRowIndex = parseInt(this.getAttribute("data-row"), 10);
        var finalFieldName = this.getAttribute("data-field");
        var finalValue = this.value;

        if (elementTab === "manage") {
          bindThat._manageRows[finalRowIndex][finalFieldName] = finalValue;
          bindThat._manageRows[finalRowIndex].isModified = true;
          bindThat._validationErrors = [];
          bindThat._validationResult = "true";
          bindThat._setProperties();
          bindThat._fireManageFieldChange(finalRowIndex, finalFieldName, finalValue);
        } else {
          bindThat._rows[finalRowIndex][finalFieldName] = finalValue;
          bindThat._validationErrors = [];
          bindThat._validationResult = "true";
          bindThat._setProperties();
          bindThat._fireFieldChange(finalRowIndex, finalFieldName, finalValue);
        }
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

if (!customElements.get("com-example-position-entry")) {
  customElements.define("com-example-position-entry", PositionEntryWidget);
}

(function() {
  if (document.getElementById("position-widget-dropdown-global-style")) {
    return;
  }

  var globalStyleEl = document.createElement("style");
  globalStyleEl.id = "position-widget-dropdown-global-style";
  globalStyleEl.textContent =
    '.position-widget-dropdown-panel {' +
      'background:#ffffff;' +
      'border:1px solid #cfd9e3;' +
      'border-radius:8px;' +
      'box-shadow:0 8px 24px rgba(34,53,72,0.18);' +
      'overflow:hidden;' +
      'min-width:220px;' +
      'max-width:380px;' +
      'max-height:340px;' +
      'z-index:999999;' +
      'font-family:"72", Arial, sans-serif;' +
    '}' +
    '.position-widget-dropdown-panel .dropdown-search-wrap {' +
      'padding:8px;' +
      'border-bottom:1px solid #e8eef5;' +
      'background:#ffffff;' +
    '}' +
    '.position-widget-dropdown-panel .dropdown-search-input {' +
      'width:100%;' +
      'height:32px;' +
      'border:1px solid #b9cae0;' +
      'border-radius:6px;' +
      'padding:0 10px;' +
      'box-sizing:border-box;' +
      'font-size:13px;' +
      'outline:none;' +
      'color:#223548;' +
    '}' +
    '.position-widget-dropdown-panel .dropdown-search-input:focus {' +
      'border-color:#0a6ed1;' +
      'box-shadow:0 0 0 2px rgba(10,110,209,0.12);' +
    '}' +
    '.position-widget-dropdown-panel .dropdown-list {' +
      'max-height:280px;' +
      'overflow:auto;' +
      'background:#ffffff;' +
    '}' +
    '.position-widget-dropdown-panel .dropdown-item {' +
      'padding:9px 10px;' +
      'font-size:13px;' +
      'color:#223548;' +
      'cursor:pointer;' +
      'border-bottom:1px solid #f3f6f9;' +
      'line-height:1.35;' +
      'word-break:break-word;' +
    '}' +
    '.position-widget-dropdown-panel .dropdown-item:hover {' +
      'background:#edf5ff;' +
    '}' +
    '.position-widget-dropdown-panel .dropdown-item.selected {' +
      'background:#e8f2ff;' +
      'color:#0a6ed1;' +
      'font-weight:600;' +
    '}' +
    '.position-widget-dropdown-panel .dropdown-empty {' +
      'padding:12px;' +
      'color:#7b8a9a;' +
      'text-align:center;' +
      'font-size:13px;' +
    '}';

  document.head.appendChild(globalStyleEl);
})();

