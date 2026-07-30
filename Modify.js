
class PositionManageWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._rows = [];
    this._filteredIndexes = [];
    this._positionSearchText = "";

    this._options = {
      companyCode: [],
      division: [],
      department: [],
      costCenter: [],
      jobCode: [],
      payGradeGroup: [],
      payGradeLevel: [],
      nationality: [],
      employeesubclass: []
    };  
    this._rowOptions = {};
    this._companyFilter = [];

    this._lastEvent = "";
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
      { key: "selected",        label: "Sel",              type: "checkbox", width: "70px"  },
      { key: "employeeId",      label: "Position ID",      type: "readonly", width: "170px" },
      { key: "companyCode",     label: "Company Code",     type: "select",   width: "160px" },
      { key: "division",        label: "Division",         type: "select",   width: "180px" },
      { key: "department",      label: "Department",       type: "select",   width: "190px" },
      { key: "costCenter",      label: "Cost Center",      type: "select",   width: "190px" },
      { key: "jobCode",         label: "Job Code",         type: "select",   width: "190px" },
      { key: "positionTitle",   label: "Position Title",   type: "text",     width: "220px" },
      { key: "payGradeGroup",   label: "Pay Grade",        type: "select",   width: "130px" },
      { key: "payGradeLevel",   label: "Level",            type: "select",   width: "110px" },
      { key: "hireDate",        label: "Hire Date",        type: "date",     width: "150px" },
      { key: "nationality",     label: "Nationality",      type: "select",   width: "160px" }, 
      { key: "employeesubclass", label: "Employee Sub Class", type: "select",   width: "170px" },
      { key: "proposed_salary", label: "Proposed Salary", type: "text",   width: "170px" },
      { key: "comment",         label: "Comment",          type: "text",     width: "260px" }
    ];

    this._pageSize    = 50;
    this._currentPage = 1;
    this._rendered    = false;
  }

  // ─────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────

  connectedCallback() {
    this._render();
    this._createDropdownPanel();
    this._rebuildFilteredIndexes();
    this._renderVisibleOnly();
    this._updateVisibleCountText();
    this._rendered = true;
    this._fireReady();
  }

  disconnectedCallback() {
    this._closeDropdown();
    if (this._dropdownPanel && this._dropdownPanel.parentNode) {
      this._dropdownPanel.parentNode.removeChild(this._dropdownPanel);
    }
    if (this._documentClickHandler) {
      document.removeEventListener("click", this._documentClickHandler);
    }
    this._dropdownPanel = null;
  }

  static get observedAttributes() {
    return ["managedata", "lastevent", "validationresult", "validationerrors"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || this._suspendAttributeSync) { return; }

    if (name === "managedata") {
      try {
        var parsed = JSON.parse(newValue || "[]");
        if (Array.isArray(parsed)) {
          this._rows = parsed;
          this._syncRowIds();
          this._rebuildFilteredIndexes();
          if (this._rendered) {
            this._renderVisibleOnly();
            this._updateVisibleCountText();
          }
        }
      } catch (e) {}
    }
  }

  // ─────────────────────────────────────────────
  // PUBLIC API — GETTERS---need to
  // ─────────────────────────────────────────────

  getManageData() {
    return JSON.stringify(this._rows || []);
  }

  getModifiedRows() {
    var out = [];
    var i = 0;
    for (i = 0; i < this._rows.length; i++) {
      if (this._rows[i].isModified === true) { out.push(this._rows[i]); }
    }
    return JSON.stringify(out);
  }

  getSelectedRows() {
    var out = [];
    var i = 0;
    for (i = 0; i < this._rows.length; i++) {
      if (this._rows[i].selected === true) { out.push(this._rows[i]); }
    }
    return JSON.stringify(out);
  }

  getLastEvent()        { return this._lastEvent || ""; }
  getValidationErrors() { return JSON.stringify(this._validationErrors || []); }
  getValidationResult() { return this._validationResult || "false"; }

  // ─────────────────────────────────────────────
  // PUBLIC API — SETTERS
  // ─────────────────────────────────────────────

   setManageData(dataStr) {
    var dataString = String(dataStr || "");

    console.log("=== setManageData called ===");
    console.log("Length:", dataString.length);
    console.log("First 300 chars:", dataString.substring(0, 300));
    console.log("Last 100 chars:",  dataString.substring(dataString.length - 100));

    try {
      var parsedRows = JSON.parse(dataString || "[]");
      this._rows = Array.isArray(parsedRows) ? parsedRows : [];
      console.log("Parse SUCCESS — rows:", this._rows.length);
    } catch (e) {
      console.error("Parse FAILED:", e.message);

      // find the exact broken position
      var errMsg = String(e.message || "");
      var posMatch = errMsg.match(/(\d+)/);
      if (posMatch) {
        var errPos = parseInt(posMatch[1], 10);
        console.log("Error position:", errPos);
        console.log("Context around error:", dataString.substring(Math.max(0, errPos - 80), errPos + 80));
      }

      this._rows = [];
    }

    this._syncRowIds();
    this._currentPage = 1;
    this._setManageDataProperty();
    this._rebuildFilteredIndexes();
    this._refreshToolbar();
    this._renderVisibleOnly();
    this._updateVisibleCountText();
  }


  setOptions(fieldName, optionsStr) {
    try {
      var optionsArray = JSON.parse(optionsStr || "[]");
      this._options[fieldName] = Array.isArray(optionsArray) ? optionsArray : [];
    } catch (e) {}
  }

  setRowOptions(rowIndex, fieldName, optionsStr) {
    try {
      var optionsArray = JSON.parse(optionsStr || "[]");
      if (!Array.isArray(optionsArray)) { optionsArray = []; }

      var visibleCount = 0;
      var i = 0;
      for (i = 0; i < this._rows.length; i++) {
        if (this._isRowVisible(this._rows[i])) {
          if (visibleCount === rowIndex) {
            var empId = this._rows[i].employeeId || ("__row__" + String(i));
            if (!this._rowOptions[empId]) { this._rowOptions[empId] = {}; }
            this._rowOptions[empId][fieldName] = optionsArray;
            return;
          }
          visibleCount++;
        }
      }
    } catch (e) {}
  }

  commitRowOptions() {
    this._renderVisibleOnly();
  }

  getVisibleIndexForRow(actualRowIndex) {
    var visibleCount = 0;
    var i = 0;
    for (i = 0; i < this._rows.length; i++) {
      if (this._isRowVisible(this._rows[i])) {
        if (i === actualRowIndex) { return visibleCount; }
        visibleCount++;
      }
    }
    return actualRowIndex;
  }

  setCellValue(rowIndex, fieldName, value) {
    var visibleCount = 0;
    var i = 0;
    for (i = 0; i < this._rows.length; i++) {
      if (this._isRowVisible(this._rows[i])) {
        if (visibleCount === rowIndex) {
          this._rows[i][fieldName] = value;
          this._rows[i].isModified = true;
          this._setManageDataProperty();
          this._renderVisibleOnly();
          return;
        }
        visibleCount++;
      }
    }
  }

  setCompanyFilter(filterStr) { return; }

  // ─────────────────────────────────────────────
  // PUBLIC API — ACTIONS
  // ─────────────────────────────────────────────

  loadData() {
    this._lastEvent = "loadManage";
    this._setProperties();
    this._dispatch("onDataChange");
  }

  saveData() {
    this._lastEvent = "saveManage";
    this._setProperties();
    this._dispatch("onDataChange");
  }

  deleteSelected() {
    this._lastEvent = "deleteManage";
    this._setProperties();
    this._dispatch("onDataChange");
  }

  clear() {
    this._rows = [];
    this._rowOptions = {};
    this._validationErrors = [];
    this._validationResult = "true";
    this._lastEvent = "clearManage";
    this._positionSearchText = "";
    this._currentPage = 1;
    this._setProperties();
    this._rebuildFilteredIndexes();
    this._refreshToolbar();
    this._renderVisibleOnly();
    this._updateVisibleCountText();
    this._dispatch("onDataChange");
  }

  validate() {
    var result = this._validateRows();
    this._validationErrors = result.errors;
    this._validationResult = result.isValid ? "true" : "false";
    this._lastEvent = "validateManage";
    this._setProperties();
    this._renderVisibleOnly();
    this._dispatch("onValidate");
    return this._validationResult;
  }

  // ─────────────────────────────────────────────
  // INTERNAL — VALIDATION
  // ─────────────────────────────────────────────

  _validateSilently() {
    var result = this._validateRows();
    this._validationErrors = result.errors;
    this._validationResult = result.isValid ? "true" : "false";
    this._lastEvent = "validateManage";
    this._setProperties();
    return this._validationResult;
  }

  _validateRows() {
    var errors = [];
    var idMap = {};
    var i = 0;
    var selectedCount = 0;

    for (i = 0; i < this._rows.length; i++) {
      if (this._rows[i].selected === true) {
        selectedCount++;
        if (this._rows[i].employeeId) {
          if (!idMap[this._rows[i].employeeId]) {
            idMap[this._rows[i].employeeId] = 1;
          } else {
            idMap[this._rows[i].employeeId]++;
          }
        }
      }
    }

    if (selectedCount === 0) {
      errors.push({ tab: "manage", rowIndex: -1, rowId: "", messages: ["Please select at least one row."] });
      return { isValid: false, errors: errors };
    }

    for (i = 0; i < this._rows.length; i++) {
      var row = this._rows[i];
      var rowErrors = [];

      if (row.selected !== true) { continue; }

      if (!row.employeeId)      { rowErrors.push("Position ID is required"); }
      if (!row.companyCode)     { rowErrors.push("Company Code is required"); }
      if (!row.division)        { rowErrors.push("Division is required"); }
      if (!row.department)      { rowErrors.push("Department is required"); }
      if (!row.costCenter)      { rowErrors.push("Cost Center is required"); }
      if (!row.jobCode)         { rowErrors.push("Job Code is required"); }
      if (!row.positionTitle)   { rowErrors.push("Position Title is required"); }
      if (!row.payGradeGroup)   { rowErrors.push("Pay Grade is required"); }
      if (!row.payGradeLevel)   { rowErrors.push("Level is required"); }
      if (!row.hireDate)        { rowErrors.push("Hire Date is required"); }
      if (!row.nationality)     { rowErrors.push("Nationality is required"); }
      if (!row.employeesubclass) { rowErrors.push("Special Approval is required"); }
      if (!row.proposed_salary) { rowErrors.push("Proposed Salary is required"); }
      
      if (row.employeeId && idMap[row.employeeId] > 1) {
        rowErrors.push("Duplicate Position ID in selected rows");
      }

      if (rowErrors.length > 0) {
        errors.push({ tab: "manage", rowIndex: i, rowId: row.rowId, messages: rowErrors });
      }
    }

    return { isValid: errors.length === 0, errors: errors };
  }

  // ─────────────────────────────────────────────
  // INTERNAL — ROW HELPERS
  // ─────────────────────────────────────────────

  _syncRowIds() {
    var i = 0;
    for (i = 0; i < this._rows.length; i++) {
      this._rows[i].rowId = i + 1;
      if (this._rows[i].selected   === undefined) { this._rows[i].selected   = false; }
      if (this._rows[i].isModified === undefined) { this._rows[i].isModified = false; }
    }
  }

  // ─────────────────────────────────────────────
  // INTERNAL — OPTIONS HELPERS
  // ─────────────────────────────────────────────

  _getOptionsForCell(rowIndex, fieldName) {
    var empId = this._rows[rowIndex]
      ? (this._rows[rowIndex].employeeId || ("__row__" + String(rowIndex)))
      : ("__row__" + String(rowIndex));

    if (
      this._rowOptions[empId] &&
      this._rowOptions[empId][fieldName] &&
      Array.isArray(this._rowOptions[empId][fieldName])
    ) {
      return this._rowOptions[empId][fieldName];
    }

    return this._options[fieldName] || [];
  }

  _getOptionText(rowIndex, fieldName, value) {
    var list = this._getOptionsForCell(rowIndex, fieldName);
    var i = 0;
    for (i = 0; i < list.length; i++) {
      if (String(list[i].key) === String(value)) {
        return list[i].text !== undefined ? list[i].text : list[i].key;
      }
    }
    return value ? String(value) : "";
  }

  // ─────────────────────────────────────────────
  // INTERNAL — FILTER / PAGING
  // ─────────────────────────────────────────────

  _isRowVisible(rowData) {
    var searchText = String(this._positionSearchText || "").toLowerCase().trim();
    var employeeId = String(rowData.employeeId || "").toLowerCase();
    if (searchText !== "") { return employeeId.indexOf(searchText) > -1; }
    return true;
  }

  _rebuildFilteredIndexes() {
    var i = 0;
    this._filteredIndexes = [];
    for (i = 0; i < this._rows.length; i++) {
      if (this._isRowVisible(this._rows[i])) {
        this._filteredIndexes.push(i);
      }
    }
    this._currentPage = 1;
  }

  _getTotalPages() {
    if (this._filteredIndexes.length === 0) { return 1; }
    return Math.ceil(this._filteredIndexes.length / this._pageSize);
  }

  _getPagedIndexes() {
    var start = (this._currentPage - 1) * this._pageSize;
    var end   = start + this._pageSize;
    return this._filteredIndexes.slice(start, end);
  }

  _goToPreviousPage() {
    if (this._currentPage > 1) {
      this._currentPage--;
      this._renderVisibleOnly();
      this._updateVisibleCountText();
    }
  }

  _goToNextPage() {
    if (this._currentPage < this._getTotalPages()) {
      this._currentPage++;
      this._renderVisibleOnly();
      this._updateVisibleCountText();
    }
  }

  // ─────────────────────────────────────────────
  // INTERNAL — PROPERTIES / EVENTS
  // ─────────────────────────────────────────────

  _setProperties() {
    this._setManageDataProperty();
    this._suspendAttributeSync = true;
    this.setAttribute("lastevent",        this._lastEvent || "");
    this.setAttribute("validationresult", this._validationResult || "true");
    this.setAttribute("validationerrors", JSON.stringify(this._validationErrors || []));
    this._suspendAttributeSync = false;
  }

  _setManageDataProperty() {
    this._suspendAttributeSync = true;
    this.setAttribute("managedata", JSON.stringify(this._rows));
    this._suspendAttributeSync = false;
  }

  _dispatch(name) {
    this.dispatchEvent(new CustomEvent(name, { detail: {} }));
  }

  _fireReady() {
    this._lastEvent = "ready";
    this._setProperties();
    this._dispatch("onReady");
  }

  _fireFieldChange(rowIndex, fieldName, value) {
    this._lastEvent =
      "manageFieldChange|" + String(rowIndex) + "|" + String(fieldName) + "|" + String(value);
    this._setProperties();
    this._dispatch("onDataChange");
  }

  // ─────────────────────────────────────────────
  // INTERNAL — SELECTION HELPERS
  // ─────────────────────────────────────────────

  _hasSelectedRows() {
    var i = 0;
    for (i = 0; i < this._rows.length; i++) {
      if (this._rows[i].selected === true) { return true; }
    }
    return false;
  }

  _areAllVisibleRowsSelected() {
    var i = 0;
    var paged = this._getPagedIndexes();
    if (!paged.length) { return false; }
    for (i = 0; i < paged.length; i++) {
      if (this._rows[paged[i]].selected !== true) { return false; }
    }
    return true;
  }

  _toggleSelectAllVisible(checked) {
    var i = 0;
    var paged = this._getPagedIndexes();
    for (i = 0; i < paged.length; i++) {
      this._rows[paged[i]].selected   = checked;
      this._rows[paged[i]].isModified = true;
    }
    this._validationErrors = [];
    this._validationResult = "true";
    this._lastEvent = "manageSelectAll|" + (checked ? "true" : "false");
    this._setProperties();
    this._refreshToolbar();
    this._renderVisibleOnly();
    this._updateVisibleCountText();
    this._dispatch("onDataChange");
  }

  // ─────────────────────────────────────────────
  // INTERNAL — TOOLBAR REFRESH (no full re-render)
  // ─────────────────────────────────────────────

  _refreshToolbar() {
    var hasSelection = this._hasSelectedRows();
    var allSelected  = this._areAllVisibleRowsSelected();

    var btnDelete = this.shadowRoot.getElementById("btnDelete");
    var toolbarRight = this.shadowRoot.getElementById("toolbarRight");

    // Update select-all checkbox
    var selectAll = this.shadowRoot.getElementById("selectAll");
    if (selectAll) { selectAll.checked = allSelected; }

    // Show/hide delete button
    if (toolbarRight) {
      var existingDelete = this.shadowRoot.getElementById("btnDelete");
      if (hasSelection && !existingDelete) {
        var newDeleteBtn = document.createElement("button");
        newDeleteBtn.className = "btn danger";
        newDeleteBtn.id = "btnDelete";
        newDeleteBtn.textContent = "Delete Selected";
        newDeleteBtn.addEventListener("click", this.deleteSelected.bind(this));
        var btnClear = this.shadowRoot.getElementById("btnClear");
        if (btnClear) {
          toolbarRight.insertBefore(newDeleteBtn, btnClear);
        } else {
          toolbarRight.appendChild(newDeleteBtn);
        }
      } else if (!hasSelection && existingDelete) {
        existingDelete.parentNode.removeChild(existingDelete);
      }
    }
  }

  // ─────────────────────────────────────────────
  // INTERNAL — RENDER HELPERS
  // ─────────────────────────────────────────────

  _updateVisibleCountText() {
    var visibleText = this.shadowRoot.getElementById("visibleCountText");
    if (visibleText) {
      visibleText.textContent = "Visible: " + this._filteredIndexes.length;
    }

    var pageInfo = this.shadowRoot.getElementById("pageInfo");
    if (pageInfo) {
      pageInfo.textContent = "Page " + this._currentPage + " of " + this._getTotalPages();
    }

    var loadMoreInfo = this.shadowRoot.getElementById("loadMoreInfo");
    if (loadMoreInfo) {
      var total = this._filteredIndexes.length;
      var start = total === 0 ? 0 : ((this._currentPage - 1) * this._pageSize) + 1;
      var end   = Math.min(this._currentPage * this._pageSize, total);
      loadMoreInfo.textContent = "Showing " + start + " to " + end + " of " + total;
    }
  }

  _getRowErrorMap() {
    var map = {};
    var i = 0;
    for (i = 0; i < this._validationErrors.length; i++) {
      map[this._validationErrors[i].rowIndex] = this._validationErrors[i].messages;
    }
    return map;
  }

  // ─────────────────────────────────────────────
  // INTERNAL — FULL RENDER (called once on connect)
  // ─────────────────────────────────────────────

  _render() {
    var styleHtml =
      '<style>' +
        ':host { display:block; font-family:"72", Arial, sans-serif; color:#223548; }' +
        '.wrap { border:1px solid #d9e2ef; border-radius:12px; background:#ffffff; overflow:hidden; }' +
        '.toolbarWrap { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:12px; border-bottom:1px solid #e5edf7; background:#f8fbff; flex-wrap:wrap; }' +
        '.toolbarLeft  { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }' +
        '.toolbarRight { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }' +
        '.searchBox { width:260px; max-width:100%; height:36px; border:1px solid #c7d7ea; background:#ffffff; color:#223548; border-radius:8px; padding:0 12px; font-size:13px; outline:none; }' +
        '.searchBox:focus { border-color:#0a6ed1; box-shadow:0 0 0 2px rgba(10,110,209,0.12); }' +
        '.btn { border:1px solid #c7d7ea; background:#ffffff; color:#0a6ed1; border-radius:8px; padding:8px 14px; cursor:pointer; font-weight:600; font-size:13px; }' +
        '.btn:hover { background:#f3f8fd; }' +
        '.btn.primary { background:#0a6ed1; color:#ffffff; border-color:#0a6ed1; }' +
        '.btn.danger  { color:#bb1e1e; border-color:#efb4b4; background:#fff7f7; }' +
        '.gridWrap { overflow:auto; max-height:520px; background:#ffffff; }' +
        'table { border-collapse:separate; border-spacing:0; width:max-content; min-width:100%; }' +
        'th, td { border-bottom:1px solid #edf2f7; padding:8px; vertical-align:top; white-space:nowrap; box-sizing:border-box; }' +
        'th { position:sticky; top:0; background:#eef4fb; z-index:2; text-align:left; font-size:12px; color:#223548; font-weight:700; }' +
        'tr:hover td { background:#fafcff; }' +
        'tr.errorRow    td { background:#fff7f7; }' +
        'tr.modifiedRow td { background:#fffbeb; }' +
        '.cell { width:100%; box-sizing:border-box; min-height:34px; height:34px; border:1px solid #c9d6e5; border-radius:6px; padding:6px 10px; font-size:13px; background:#fff; color:#223548; outline:none; }' +
        '.cell.error, .dropdown-trigger.error { border-color:#e25555; background:#fff5f5; }' +
        '.readonly-cell { width:100%; min-height:34px; height:34px; border:1px solid #d6dee8; border-radius:6px; padding:6px 10px; font-size:13px; background:#f6f8fb; color:#425466; box-sizing:border-box; display:flex; align-items:center; }' +
        '.rowErr { margin-top:4px; font-size:11px; color:#c53030; white-space:normal; max-width:240px; line-height:1.3; }' +
        '.dropdown-trigger { width:100%; min-height:34px; height:34px; border:1px solid #c9d6e5; border-radius:6px; background:#fff; display:flex; align-items:center; justify-content:space-between; box-sizing:border-box; padding:0 10px; cursor:pointer; font-size:13px; color:#223548; user-select:none; }' +
        '.dropdown-trigger .label { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:8px; }' +
        '.dropdown-trigger .arrow { color:#6a7f94; font-size:11px; flex:0 0 auto; }' +
        '.row-checkbox { width:24px; height:24px; cursor:pointer; margin-top:6px; accent-color:#0a6ed1; }' +
        '.select-all-wrap { display:flex; align-items:center; gap:6px; }' +
        '.select-all-checkbox { width:18px; height:18px; cursor:pointer; accent-color:#0a6ed1; }' +
        '.muted { font-size:12px; color:#6b7c93; }' +
        '.pager { display:flex; justify-content:flex-end; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid #e5edf7; background:#ffffff; }' +
        '.empty-msg { padding:40px; text-align:center; color:#8a9bb0; font-size:14px; }' +
      '</style>';

    var html = "";
    html += '<div class="wrap">';

    // toolbar
    html += '<div class="toolbarWrap">';
    html += '<div class="toolbarLeft">';
    html += '<input id="positionSearchBox" class="searchBox" type="text" placeholder="Search Position ID..." value="" />';
    html += '<span class="muted" id="visibleCountText">Visible: 0</span>';
    html += '</div>';
    html += '<div class="toolbarRight" id="toolbarRight">';
    html += '<button class="btn" id="btnLoad">Load Data</button>';
    html += '<button class="btn" id="btnValidate">Validate</button>';
    html += '<button class="btn primary" id="btnSave">Save Changes</button>';
    html += '<button class="btn" id="btnClear">Clear</button>';
    html += '</div>';
    html += '</div>';

    // pager
    html += '<div class="pager">';
    html += '<span class="muted" id="loadMoreInfo">Showing 0 to 0 of 0</span>';
    html += '<button class="btn" id="btnPrevPage">Previous</button>';
    html += '<span class="muted" id="pageInfo">Page 1 of 1</span>';
    html += '<button class="btn" id="btnNextPage">Next</button>';
    html += '</div>';

    // grid
    html += '<div class="gridWrap" id="gridWrap">';
    html += '<table>';
    html += '<thead><tr>';

    var i = 0;
    for (i = 0; i < this._columns.length; i++) {
      if (this._columns[i].key === "selected") {
        html += '<th style="width:' + this._columns[i].width + '">'
          + '<div class="select-all-wrap"><span>Sel</span>'
          + '<input class="select-all-checkbox" type="checkbox" id="selectAll" title="Select Current Page" /></div></th>';
      } else {
        html += '<th style="width:' + this._columns[i].width + '">' + this._columns[i].label + '</th>';
      }
    }

    html += '</tr></thead>';
    html += '<tbody id="tbodyVirtual"></tbody>';
    html += '</table>';
    html += '</div>';
    html += '</div>';

    this.shadowRoot.innerHTML = styleHtml + html;

    // bind toolbar buttons
    this.shadowRoot.getElementById("btnLoad").addEventListener("click",     this.loadData.bind(this));
    this.shadowRoot.getElementById("btnValidate").addEventListener("click", this.validate.bind(this));
    this.shadowRoot.getElementById("btnSave").addEventListener("click",     this.saveData.bind(this));
    this.shadowRoot.getElementById("btnClear").addEventListener("click",    this.clear.bind(this));
    this.shadowRoot.getElementById("btnPrevPage").addEventListener("click", this._goToPreviousPage.bind(this));
    this.shadowRoot.getElementById("btnNextPage").addEventListener("click", this._goToNextPage.bind(this));

    var selectAll = this.shadowRoot.getElementById("selectAll");
    if (selectAll) {
      selectAll.addEventListener("change", function() {
        this._toggleSelectAllVisible(selectAll.checked);
      }.bind(this));
    }

    var positionSearchBox = this.shadowRoot.getElementById("positionSearchBox");
    if (positionSearchBox) {
      positionSearchBox.addEventListener("input", function() {
        this._positionSearchText = positionSearchBox.value || "";
        this._rebuildFilteredIndexes();
        this._updateVisibleCountText();
        this._renderVisibleOnly();
      }.bind(this));
    }
  }

  // ─────────────────────────────────────────────
  // INTERNAL — PARTIAL RENDER (rows only)
  // ─────────────────────────────────────────────

  _renderVisibleOnly() {
    var tbody = this.shadowRoot.getElementById("tbodyVirtual");
    if (!tbody) { return; }

    var visibleIndexes = this._getPagedIndexes();
    var rowErrorMap    = this._getRowErrorMap();
    var html = "";
    var i = 0;
    var j = 0;

    if (visibleIndexes.length === 0) {
      var colCount = this._columns.length;
      html = '<tr><td colspan="' + colCount + '" class="empty-msg">No data to display. Click <b>Load Data</b> to begin.</td></tr>';
      tbody.innerHTML = html;
      this._updateVisibleCountText();
      return;
    }

    for (i = 0; i < visibleIndexes.length; i++) {
      var actualIndex = visibleIndexes[i];
      var row         = this._rows[actualIndex];
      var rowErrors   = rowErrorMap[actualIndex] || [];
      var rowClass    = "";

      if (rowErrors.length) {
        rowClass = "errorRow";
      } else if (row.isModified === true) {
        rowClass = "modifiedRow";
      }

      html += '<tr class="' + rowClass + '">';

      for (j = 0; j < this._columns.length; j++) {
        html += '<td style="width:' + this._columns[j].width + '">'
          + this._renderCell(row, actualIndex, this._columns[j], rowErrors)
          + '</td>';
      }

      html += '</tr>';
    }

    tbody.innerHTML = html;
    this._bindCellEvents();
    this._updateVisibleCountText();

    // sync select-all checkbox
    var selectAll = this.shadowRoot.getElementById("selectAll");
    if (selectAll) { selectAll.checked = this._areAllVisibleRowsSelected(); }
  }

  // ─────────────────────────────────────────────
  // INTERNAL — CELL RENDER
  // ─────────────────────────────────────────────

  _renderCell(rowData, rowIndex, columnData, rowErrors) {
    var cellHasError = this._hasFieldError(columnData.key, rowErrors);
    var errorCss     = cellHasError ? "error" : "";
    var cellValue    = (rowData[columnData.key] !== undefined && rowData[columnData.key] !== null)
                       ? rowData[columnData.key] : "";

    if (columnData.type === "checkbox") {
      return '<input class="row-checkbox ' + errorCss + '" data-row="' + rowIndex + '" data-field="' + columnData.key + '" data-type="checkbox" type="checkbox" ' + (cellValue === true ? "checked" : "") + ' />';
    }

    if (columnData.type === "readonly") {
      return '<div class="readonly-cell" data-row="' + rowIndex + '" data-field="' + columnData.key + '" data-type="readonly">'
        + this._escapeHtml(String(cellValue))
        + '</div>'
        + this._renderFieldErrors(columnData.key, rowErrors);
    }

    if (columnData.type === "select") {
      var displayText = this._getOptionText(rowIndex, columnData.key, cellValue);
      if (!displayText) { displayText = cellValue ? String(cellValue) : "Select..."; }

      return '<div class="dropdown-trigger ' + errorCss + '" tabindex="0"'
        + ' data-row="' + rowIndex + '" data-field="' + columnData.key + '" data-type="select">'
        + '<span class="label">' + this._escapeHtml(String(displayText)) + '</span>'
        + '<span class="arrow">▼</span>'
        + '</div>'
        + this._renderFieldErrors(columnData.key, rowErrors);
    }

    var inputTypeName = columnData.type === "date" ? "date" : "text";

    return '<input class="cell ' + errorCss + '"'
      + ' data-row="' + rowIndex + '"'
      + ' data-field="' + columnData.key + '"'
      + ' data-type="' + columnData.type + '"'
      + ' type="' + inputTypeName + '"'
      + ' value="' + this._escapeHtml(String(cellValue)) + '" />'
      + this._renderFieldErrors(columnData.key, rowErrors);
  }

  _renderFieldErrors(fieldName, rowErrors) {
    var messages = [];
    var i = 0;

    for (i = 0; i < rowErrors.length; i++) {
      var text = rowErrors[i];
      if (
        (fieldName === "companyCode"     && text.indexOf("Company Code")     === 0) ||
        (fieldName === "division"        && text.indexOf("Division")         === 0) ||
        (fieldName === "department"      && text.indexOf("Department")       === 0) ||
        (fieldName === "costCenter"      && text.indexOf("Cost Center")      === 0) ||
        (fieldName === "jobCode"         && text.indexOf("Job Code")         === 0) ||
        (fieldName === "positionTitle"   && text.indexOf("Position Title")   === 0) ||
        (fieldName === "employeeId"      && (text.indexOf("Position ID") === 0 || text.indexOf("Duplicate") === 0)) ||
        (fieldName === "payGradeGroup"   && text.indexOf("Pay Grade")        === 0) ||
        (fieldName === "payGradeLevel"   && text.indexOf("Level")            === 0) ||
        (fieldName === "hireDate"        && text.indexOf("Hire Date")        === 0) ||
        (fieldName === "nationality"     && text.indexOf("Nationality")      === 0) ||
        (fieldName === "employeesubclass" && text.indexOf("Special Approval") === 0) ||
        (fieldName === "proposed_salary" && text.indexOf("Proposed Salary") === 0) ||
        (fieldName === "comment"         && text.indexOf("Comment")          === 0)
        
      ) {
        messages.push(text);
      }
    }

    if (!messages.length) { return ""; }
    return '<div class="rowErr">' + messages.join("<br>") + '</div>';
  }

  _hasFieldError(fieldName, rowErrors) {
    return this._renderFieldErrors(fieldName, rowErrors) !== "";
  }

  // ─────────────────────────────────────────────
  // INTERNAL — EVENT BINDING
  // ─────────────────────────────────────────────

  _bindCellEvents() {
    var that = this;
    var allCellElements = this.shadowRoot.querySelectorAll("[data-row][data-field]");

    Array.prototype.forEach.call(allCellElements, function(el) {
      var elementType = el.getAttribute("data-type");

      if (elementType === "checkbox") {
        el.addEventListener("change", function() {
          var rowIndex  = parseInt(this.getAttribute("data-row"), 10);
          var fieldName = this.getAttribute("data-field");
          var value     = this.checked;

          that._rows[rowIndex][fieldName] = value;
          that._rows[rowIndex].isModified = true;
          that._validationErrors = [];
          that._validationResult = "true";
          that._setProperties();
          that._refreshToolbar();
          that._renderVisibleOnly();
          that._fireFieldChange(rowIndex, fieldName, value);
        });
        return;
      }

      if (elementType === "select") {
        el.addEventListener("click", function(e) {
          e.stopPropagation();
          var rowIndex  = parseInt(this.getAttribute("data-row"), 10);
          var fieldName = this.getAttribute("data-field");
          that._openDropdown(this, rowIndex, fieldName);
        });

        el.addEventListener("keydown", function(e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            var rowIndex  = parseInt(this.getAttribute("data-row"), 10);
            var fieldName = this.getAttribute("data-field");
            that._openDropdown(this, rowIndex, fieldName);
          }
        });
        return;
      }

      if (elementType === "readonly") { return; }

      el.addEventListener("input", function() {
        var rowIndex  = parseInt(this.getAttribute("data-row"), 10);
        var fieldName = this.getAttribute("data-field");
        var value     = this.value;

        that._rows[rowIndex][fieldName] = value;
        that._rows[rowIndex].isModified = true;
        that._validationErrors = [];
        that._validationResult = "true";
        that._setManageDataProperty();
      });

      el.addEventListener("change", function() {
        var rowIndex  = parseInt(this.getAttribute("data-row"), 10);
        var fieldName = this.getAttribute("data-field");
        var value     = this.value;

        that._rows[rowIndex][fieldName] = value;
        that._rows[rowIndex].isModified = true;
        that._validationErrors = [];
        that._validationResult = "true";
        that._setProperties();
        that._fireFieldChange(rowIndex, fieldName, value);
      });
    });
  }

  // ─────────────────────────────────────────────
  // INTERNAL — DROPDOWN
  // ─────────────────────────────────────────────

  _createDropdownPanel() {
    if (this._dropdownPanel) { return; }

    var dropdownPanel = document.createElement("div");
    dropdownPanel.className = "position-widget-dropdown-panel";
    dropdownPanel.style.display = "none";
    dropdownPanel.innerHTML =
      '<div class="dropdown-search-wrap">' +
        '<input type="text" class="dropdown-search-input" placeholder="Search..." />' +
      '</div>' +
      '<div class="dropdown-list"></div>';

    document.body.appendChild(dropdownPanel);

    this._dropdownPanel  = dropdownPanel;
    this._dropdownSearch = dropdownPanel.querySelector(".dropdown-search-input");
    this._dropdownList   = dropdownPanel.querySelector(".dropdown-list");

    var that = this;

    this._dropdownSearch.addEventListener("input", function() {
      that._renderDropdownItems(this.value);
    });

    this._documentClickHandler = function(e) {
      if (!that._dropdownOpen) { return; }
      var insidePanel   = that._dropdownPanel   && that._dropdownPanel.contains(e.target);
      var insideShadow  = that.shadowRoot        && that.shadowRoot.contains(e.target);
      if (!insidePanel && !insideShadow) {
        that._closeDropdown();
      }
    };

    document.addEventListener("click", this._documentClickHandler);
  }

  _openDropdown(triggerEl, rowIndex, fieldName) {
    this._createDropdownPanel();

    this._activeDropdownTrigger     = triggerEl;
    this._activeDropdownRow         = rowIndex;
    this._activeDropdownField       = fieldName;
    this._activeDropdownOptions     = this._getOptionsForCell(rowIndex, fieldName) || [];
    this._activeDropdownSelectedKey = this._rows[rowIndex] ? this._rows[rowIndex][fieldName] : "";

    var triggerRect   = triggerEl.getBoundingClientRect();
    var dropdownWidth = Math.max(triggerRect.width, 260);
    var dropdownTop   = triggerRect.bottom + 4;
    var dropdownLeft  = triggerRect.left;

    if (dropdownLeft + dropdownWidth > window.innerWidth - 10) {
      dropdownLeft = window.innerWidth - dropdownWidth - 10;
    }
    if (dropdownLeft < 10) { dropdownLeft = 10; }

    this._dropdownPanel.style.display  = "block";
    this._dropdownPanel.style.position = "fixed";
    this._dropdownPanel.style.left     = dropdownLeft + "px";
    this._dropdownPanel.style.top      = dropdownTop  + "px";
    this._dropdownPanel.style.width    = dropdownWidth + "px";
    this._dropdownPanel.style.zIndex   = "999999";

    this._dropdownSearch.value = "";
    this._renderDropdownItems("");
    this._dropdownOpen = true;

    var that = this;
    setTimeout(function() {
      if (that._dropdownSearch) { that._dropdownSearch.focus(); }
    }, 0);
  }

  _closeDropdown() {
    if (this._dropdownPanel) { this._dropdownPanel.style.display = "none"; }
    this._dropdownOpen              = false;
    this._activeDropdownTrigger     = null;
    this._activeDropdownRow         = -1;
    this._activeDropdownField       = "";
    this._activeDropdownOptions     = [];
    this._activeDropdownSelectedKey = "";
  }

  _renderDropdownItems(searchText) {
    if (!this._dropdownList) { return; }

    var that        = this;
    var searchValue = String(searchText || "").toLowerCase().trim();
    var source      = this._activeDropdownOptions || [];
    var filtered    = [];
    var i = 0;

    for (i = 0; i < source.length; i++) {
      var key    = source[i].key  !== undefined ? String(source[i].key)  : "";
      var text   = source[i].text !== undefined ? String(source[i].text) : key;
      var search = (key + " " + text).toLowerCase();

      if (searchValue === "" || search.indexOf(searchValue) > -1) {
        filtered.push({ key: key, text: text });
      }
    }

    this._dropdownList.innerHTML = "";

    if (filtered.length === 0) {
      this._dropdownList.innerHTML = '<div class="dropdown-empty">No results found</div>';
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

      item.addEventListener("mousedown", function(e) {
        e.preventDefault();
        var selectedKeyValue = this.getAttribute("data-key");

        that._rows[that._activeDropdownRow][that._activeDropdownField] = selectedKeyValue;
        that._rows[that._activeDropdownRow].isModified = true;
        that._validationErrors = [];
        that._validationResult = "true";
        that._setProperties();
        that._renderVisibleOnly();
        that._fireFieldChange(that._activeDropdownRow, that._activeDropdownField, selectedKeyValue);
        that._closeDropdown();
      });

      this._dropdownList.appendChild(item);
    }
  }

  // ─────────────────────────────────────────────
  // INTERNAL — UTILITIES
  // ─────────────────────────────────────────────

  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

// ─────────────────────────────────────────────
// REGISTER CUSTOM ELEMENT
// ─────────────────────────────────────────────

if (!customElements.get("com-example-position-managee")) {
  customElements.define("com-example-position-managee", PositionManageWidget);
}

// ─────────────────────────────────────────────
// GLOBAL DROPDOWN STYLES
// ─────────────────────────────────────────────

(function() {
  if (document.getElementById("position-widget-dropdown-global-style")) { return; }

  var globalStyleEl = document.createElement("style");
  globalStyleEl.id  = "position-widget-dropdown-global-style";
  globalStyleEl.textContent =
    '.position-widget-dropdown-panel {'
    +   'background:#ffffff;'
    +   'border:1px solid #cfd9e3;'
    +   'border-radius:8px;'
    +   'box-shadow:0 8px 24px rgba(34,53,72,0.18);'
    +   'overflow:hidden;'
    +   'min-width:220px;'
    +   'max-width:480px;'
    +   'max-height:340px;'
    +   'z-index:999999;'
    +   'font-family:"72", Arial, sans-serif;'
    + '}'
    + '.position-widget-dropdown-panel .dropdown-search-wrap {'
    +   'padding:8px;'
    +   'border-bottom:1px solid #e8eef5;'
    +   'background:#ffffff;'
    + '}'
    + '.position-widget-dropdown-panel .dropdown-search-input {'
    +   'width:100%;'
    +   'height:32px;'
    +   'border:1px solid #b9cae0;'
    +   'border-radius:6px;'
    +   'padding:0 10px;'
    +   'box-sizing:border-box;'
    +   'font-size:13px;'
    +   'outline:none;'
    +   'color:#223548;'
    + '}'
    + '.position-widget-dropdown-panel .dropdown-search-input:focus {'
    +   'border-color:#0a6ed1;'
    +   'box-shadow:0 0 0 2px rgba(10,110,209,0.12);'
    + '}'
    + '.position-widget-dropdown-panel .dropdown-list {'
    +   'max-height:280px;'
    +   'overflow:auto;'
    +   'background:#ffffff;'
    + '}'
    + '.position-widget-dropdown-panel .dropdown-item {'
    +   'padding:9px 10px;'
    +   'font-size:13px;'
    +   'color:#223548;'
    +   'cursor:pointer;'
    +   'border-bottom:1px solid #f3f6f9;'
    +   'line-height:1.35;'
    +   'word-break:break-word;'
    + '}'
    + '.position-widget-dropdown-panel .dropdown-item:hover {'
    +   'background:#edf5ff;'
    + '}'
    + '.position-widget-dropdown-panel .dropdown-item.selected {'
    +   'background:#e8f2ff;'
    +   'color:#0a6ed1;'
    +   'font-weight:600;'
    + '}'
    + '.position-widget-dropdown-panel .dropdown-empty {'
    +   'padding:12px;'
    +   'color:#7b8a9a;'
    +   'text-align:center;'
    +   'font-size:13px;'
    + '}';

  document.head.appendChild(globalStyleEl);
})();
