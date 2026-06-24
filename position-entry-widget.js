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

    this._columns = [
      { key: "selected", label: "Sel", type: "checkbox", width: "50px" },
      { key: "companyCode", label: "Company Code", type: "select", width: "140px" },
      { key: "division", label: "Division", type: "select", width: "140px" },
      { key: "department", label: "Department", type: "select", width: "160px" },
      { key: "costCenter", label: "Cost Center", type: "select", width: "160px" },
      { key: "jobCode", label: "Job Code", type: "select", width: "160px" },
      { key: "positionTitle", label: "Position Title", type: "text", width: "180px" },
      { key: "employeeId", label: "Employee ID", type: "text", width: "160px" },
      { key: "noOfPositions", label: "No. of Positions", type: "number", width: "120px" },
      { key: "payGradeGroup", label: "Pay Grade", type: "select", width: "120px" },
      { key: "payGradeLevel", label: "Level", type: "select", width: "90px" },
      { key: "hireDate", label: "Hire Date", type: "date", width: "140px" },
      { key: "nationality", label: "Nationality", type: "select", width: "140px" },
      { key: "accommodation", label: "Accommodation", type: "select", width: "140px" },
      { key: "transport", label: "Transport", type: "select", width: "140px" },
      { key: "employeeClass", label: "Employee Class", type: "select", width: "140px" },
      { key: "overtime", label: "Overtime", type: "select", width: "120px" },
      { key: "specialApproval", label: "Special Approval", type: "select", width: "150px" },
      { key: "comment", label: "Comment", type: "text", width: "220px" }
    ];
  }

  connectedCallback() {
    if (!this._rows.length) {
      this._rows = [this._createEmptyRow(1)];
    }
    this._render();
    this._fireReady();
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
        + "noOfPositions::" + this._safeValue(r.noOfPositions) + "~~"
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
    this._lastEvent = "validate|" + String(this._validationResult) + "|" + String(result.errors.length);
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

      var selectEl = this.shadowRoot.querySelector('select[data-row="' + rowIndex + '"][data-field="' + fieldName + '"]');
      if (selectEl) {
        var currentValue = this._rows[rowIndex] ? (this._rows[rowIndex][fieldName] || "") : "";
        var optionsHtml = `<option value=""></option>` + arr.map(function(o) {
          var key = o.key !== undefined ? o.key : "";
          var text = o.text !== undefined ? o.text : key;
          var selected = String(key) === String(currentValue) ? "selected" : "";
          return `<option value="${key}" ${selected}>${text}</option>`;
        }).join("");
        selectEl.innerHTML = optionsHtml;
        selectEl.value = currentValue;
      }
    } catch (e) {}
  }

  setCellValue(rowIndex, fieldName, value) {
    if (!this._rows[rowIndex]) {
      return;
    }

    this._rows[rowIndex][fieldName] = value;
    this._setDataProperty();

    var el = this.shadowRoot.querySelector('[data-row="' + rowIndex + '"][data-field="' + fieldName + '"]');
    if (el) {
      if (el.type === "checkbox") {
        el.checked = value === true;
      } else {
        el.value = value;
      }
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
      noOfPositions: "1",
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
      if (!r.noOfPositions || Number(r.noOfPositions) <= 0) rowErr.push("No. of Positions must be greater than 0");
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

  _render() {
    var that = this;
    var rowErrorMap = this._getRowErrorMap();

    var style = `
      <style>
        :host {
          display: block;
          font-family: Arial, sans-serif;
          color: #1f2937;
        }
        .wrap {
          border: 1px solid #d9e2ef;
          border-radius: 12px;
          background: #ffffff;
          overflow: hidden;
        }
        .toolbar {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-bottom: 1px solid #e5edf7;
          background: #f8fbff;
        }
        .btn {
          border: 1px solid #c7d7ea;
          background: #ffffff;
          color: #1f4f82;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-weight: 600;
        }
        .btn.primary {
          background: #1f7ae0;
          color: #ffffff;
          border-color: #1f7ae0;
        }
        .gridWrap {
          overflow: auto;
          max-height: 460px;
        }
        table {
          border-collapse: collapse;
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
          background: #eef5fc;
          z-index: 1;
          text-align: left;
          font-size: 12px;
          color: #3b4b5f;
        }
        tr.errorRow {
          background: #fff7f7;
        }
        .cell {
          width: 100%;
          box-sizing: border-box;
          min-height: 34px;
          border: 1px solid #c9d6e5;
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 13px;
          background: #fff;
        }
        .cell.error {
          border-color: #e25555;
          background: #fff5f5;
        }
        .rowErr {
          margin-top: 4px;
          font-size: 11px;
          color: #c53030;
          white-space: normal;
          max-width: 220px;
        }
        .summary {
          padding: 10px 12px;
          border-top: 1px solid #e5edf7;
          display: flex;
          gap: 18px;
          font-size: 12px;
          background: #fafcff;
        }
      </style>
    `;

    var html = `
      <div class="wrap">
        <div class="toolbar">
          <button class="btn primary" id="btnAdd">Add Row</button>
          <button class="btn" id="btnDelete">Delete Selected</button>
          <button class="btn primary" id="btnValidate">Send for Approval</button>
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

    this.shadowRoot.getElementById("btnDelete").addEventListener("click", function() {
      that._deleteSelectedRows();
    });

    this.shadowRoot.getElementById("btnValidate").addEventListener("click", function() {
    var result = that._validateAllRows();
    that._validationErrors = result.errors;
    that._validationResult = result.isValid ? "true" : "false";
    that._sendPayload = that.getData();
    that._lastEvent = result.isValid ? "sendForApproval" : "validationFailed";
    that._setProperties();
    that._render();
  
    that._dispatch("onValidate");
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
      var opts = this._getOptionsForCell(rowIndex, col.key);
      var optionsHtml = `<option value=""></option>` + opts.map(function(o) {
        var key = o.key !== undefined ? o.key : "";
        var text = o.text !== undefined ? o.text : key;
        var selected = String(key) === String(value) ? "selected" : "";
        return `<option value="${key}" ${selected}>${text}</option>`;
      }).join("");

      return `
        <select class="cell ${errClass}" data-row="${rowIndex}" data-field="${col.key}" data-type="${col.type}">
          ${optionsHtml}
        </select>
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
        (fieldName === "noOfPositions" && msg.indexOf("No. of Positions") === 0) ||
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
    var all = this.shadowRoot.querySelectorAll("[data-row][data-field]");

    all.forEach(function(el) {
      var isSelect = el.tagName === "SELECT";
      var isCheckbox = el.getAttribute("data-type") === "checkbox";

      if (isSelect) {
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
      } else if (isCheckbox) {
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
      } else {
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
          that._setDataProperty();
        });
      }
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
