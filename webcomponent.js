class DynamicPositionManageWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this._rows = [];
    this._filteredIndexes = [];
    this._positionSearchText = "";
    this._options = {};
    this._rowOptions = {};
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
    this._pageSize = 50;
    this._currentPage = 1;
    this._rendered = false;
    this._title = "Dynamic Position Manager";
    this._searchPlaceholder = "Search...";
    this._dataMode = "manual";
    this._modelBinding = {};
    this._columns = [];
    this._buttons = [];

    this._setDefaultColumns();
    this._setDefaultButtons();
  }

  static get observedAttributes() {
    return [
      "managedata",
      "lastevent",
      "validationresult",
      "validationerrors",
      "title",
      "searchplaceholder",
      "pagesize",
      "datamode",
      "schema",
      "buttons",
      "modelbinding"
    ];
  }

  connectedCallback() {
    this._loadAllProperties();
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
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || this._suspendAttributeSync) {
      return;
    }

    if (name === "managedata") {
      this._loadManageDataFromAttribute(newValue);
      return;
    }

    if (
      name === "title" ||
      name === "searchplaceholder" ||
      name === "pagesize" ||
      name === "datamode" ||
      name === "schema" ||
      name === "buttons" ||
      name === "modelbinding"
    ) {
      this._loadAllProperties();
      if (this._rendered) {
        this._render();
        this._rebuildFilteredIndexes();
        this._renderVisibleOnly();
        this._updateVisibleCountText();
      }
    }
  }

  _setDefaultColumns() {
    this._columns = [
      { key: "selected", label: "Sel", type: "checkbox", width: "70px" },
      { key: "employeeId", label: "Position ID", type: "readonly", width: "170px", required: true, unique: true },
      { key: "companyCode", label: "Company Code", type: "select", width: "160px", required: true },
      { key: "division", label: "Division", type: "select", width: "180px", required: true },
      { key: "department", label: "Department", type: "select", width: "180px", required: true },
      { key: "costCenter", label: "Cost Center", type: "select", width: "180px", required: true },
      { key: "jobCode", label: "Job Code", type: "select", width: "180px", required: true },
      { key: "positionTitle", label: "Position Title", type: "text", width: "220px", required: true },
      { key: "payGradeGroup", label: "Pay Grade", type: "select", width: "130px", required: true },
      { key: "payGradeLevel", label: "Level", type: "select", width: "110px", required: true },
      { key: "hireDate", label: "Hire Date", type: "date", width: "150px", required: true },
      { key: "nationality", label: "Nationality", type: "select", width: "160px", required: true },
      { key: "employeesubclass", label: "Employee Sub Class", type: "select", width: "170px", required: true },
      { key: "comment", label: "Comment", type: "text", width: "240px" }
    ];
  }

  _setDefaultButtons() {
    this._buttons = [
      { id: "btnLoad", text: "Load Data", action: "loadData", style: "default" },
      { id: "btnValidate", text: "Validate", action: "validate", style: "default" },
      { id: "btnSave", text: "Save Changes", action: "saveData", style: "primary" },
      { id: "btnDelete", text: "Delete Selected", action: "deleteSelected", style: "danger" },
      { id: "btnClear", text: "Clear", action: "clear", style: "default" }
    ];
  }

  _loadAllProperties() {
    this._title = this.getAttribute("title") || "Dynamic Position Manager";
    this._searchPlaceholder = this.getAttribute("searchplaceholder") || "Search...";
    this._dataMode = this.getAttribute("datamode") || "manual";

    var pageSize = parseInt(this.getAttribute("pagesize") || "50", 10);
    this._pageSize = isNaN(pageSize) ? 50 : pageSize;

    try {
      var schema = JSON.parse(this.getAttribute("schema") || "[]");
      this._columns = Array.isArray(schema) && schema.length ? schema : this._columns;
    } catch (e) {}

    try {
      var buttons = JSON.parse(this.getAttribute("buttons") || "[]");
      this._buttons = Array.isArray(buttons) && buttons.length ? buttons : this._buttons;
    } catch (e) {}

    try {
      this._modelBinding = JSON.parse(this.getAttribute("modelbinding") || "{}");
    } catch (e) {
      this._modelBinding = {};
    }
  }

  _loadManageDataFromAttribute(dataStr) {
    try {
      var parsed = JSON.parse(dataStr || "[]");
      this._rows = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      this._rows = [];
    }
    this._syncRowIds();
    this._rebuildFilteredIndexes();
    if (this._rendered) {
      this._renderVisibleOnly();
      this._updateVisibleCountText();
    }
  }

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
    this._syncRowIds();
    this._currentPage = 1;
    this._setManageDataProperty();
    this._rebuildFilteredIndexes();
    this._refreshToolbar();
    this._renderVisibleOnly();
    this._updateVisibleCountText();
  }

  getModifiedRows() {
    var out = [];
    for (var i = 0; i < this._rows.length; i++) {
      if (this._rows[i].isModified === true) {
        out.push(this._rows[i]);
      }
    }
    return JSON.stringify(out);
  }

  getSelectedRows() {
    var out = [];
    for (var i = 0; i < this._rows.length; i++) {
      if (this._rows[i].selected === true) {
        out.push(this._rows[i]);
      }
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
    return this._validationResult || "false";
  }

  setOptions(fieldName, optionsStr) {
    try {
      var parsed = JSON.parse(optionsStr || "[]");
      this._options[fieldName] = Array.isArray(parsed) ? parsed : [];
    } catch (e) {}
  }

  setRowOptions(rowIndex, fieldName, optionsStr) {
    try {
      var parsed = JSON.parse(optionsStr || "[]");
      if (!Array.isArray(parsed)) {
        parsed = [];
      }
      var rowKey = this._getRowOptionKeyByVisibleIndex(rowIndex);
      if (!this._rowOptions[rowKey]) {
        this._rowOptions[rowKey] = {};
      }
      this._rowOptions[rowKey][fieldName] = parsed;
    } catch (e) {}
  }

  commitRowOptions() {
    this._renderVisibleOnly();
  }

  setCellValue(rowIndex, fieldName, value) {
    var actualIndex = this._getActualIndexFromVisibleIndex(rowIndex);
    if (actualIndex > -1) {
      this._rows[actualIndex][fieldName] = value;
      this._rows[actualIndex].isModified = true;
      this._setManageDataProperty();
      this._renderVisibleOnly();
    }
  }

  getVisibleIndexForRow(actualRowIndex) {
    var visibleCount = 0;
    for (var i = 0; i < this._rows.length; i++) {
      if (this._isRowVisible(this._rows[i])) {
        if (i === actualRowIndex) {
          return visibleCount;
        }
        visibleCount++;
      }
    }
    return actualRowIndex;
  }

  setSchema(schemaStr) {
    try {
      var parsed = JSON.parse(schemaStr || "[]");
      if (Array.isArray(parsed) && parsed.length) {
        this._columns = parsed;
        this._setSafeAttribute("schema", JSON.stringify(parsed));
        this._render();
        this._renderVisibleOnly();
      }
    } catch (e) {}
  }

  setButtons(buttonsStr) {
    try {
      var parsed = JSON.parse(buttonsStr || "[]");
      if (Array.isArray(parsed) && parsed.length) {
        this._buttons = parsed;
        this._setSafeAttribute("buttons", JSON.stringify(parsed));
        this._render();
      }
    } catch (e) {}
  }

  applyResultSet(resultSetStr) {
    try {
      var resultSet = JSON.parse(resultSetStr || "[]");
      if (!Array.isArray(resultSet)) {
        resultSet = [];
      }

      var rows = [];
      for (var i = 0; i < resultSet.length; i++) {
        var src = resultSet[i];
        var row = {};
        for (var c = 0; c < this._columns.length; c++) {
          var col = this._columns[c];
          if (col.key === "selected") {
            row.selected = false;
            continue;
          }
          var sourceField = col.source || this._modelBinding[col.key] || col.key;
          row[col.key] = this._extractValue(src, sourceField);
        }
        row.isModified = false;
        rows.push(row);
      }

      this._rows = rows;
      this._syncRowIds();
      this._setManageDataProperty();
      this._rebuildFilteredIndexes();
      this._renderVisibleOnly();
      this._updateVisibleCountText();
    } catch (e) {}
  }

  triggerButtonAction(actionName) {
    this._lastEvent = "customButton|" + String(actionName || "");
    this._setProperties();
    this._dispatch("onCustomButton");
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

  _validateRows() {
    var errors = [];
    var selectedCount = 0;
    var uniqueMaps = {};

    for (var i = 0; i < this._rows.length; i++) {
      if (this._rows[i].selected === true) {
        selectedCount++;
      }
    }

    if (selectedCount === 0) {
      errors.push({
        tab: "manage",
        rowIndex: -1,
        rowId: "",
        messages: ["Please select at least one row."]
      });
      return { isValid: false, errors: errors };
    }

    for (var r = 0; r < this._rows.length; r++) {
      var row = this._rows[r];
      if (row.selected !== true) {
        continue;
      }

      var rowErrors = [];

      for (var c = 0; c < this._columns.length; c++) {
        var col = this._columns[c];
        if (col.key === "selected") {
          continue;
        }

        if (col.required === true) {
          var value = row[col.key];
          if (value === undefined || value === null || String(value).trim() === "") {
            rowErrors.push((col.label || col.key) + " is required");
          }
        }

        if (col.unique === true) {
          var uniqueValue = String(row[col.key] || "");
          if (uniqueValue) {
            if (!uniqueMaps[col.key]) {
              uniqueMaps[col.key] = {};
            }
            if (!uniqueMaps[col.key][uniqueValue]) {
              uniqueMaps[col.key][uniqueValue] = 1;
            } else {
              uniqueMaps[col.key][uniqueValue]++;
            }
          }
        }
      }

      if (rowErrors.length > 0) {
        errors.push({
          tab: "manage",
          rowIndex: r,
          rowId: row.rowId,
          messages: rowErrors
        });
      }
    }

    for (var r2 = 0; r2 < this._rows.length; r2++) {
      var row2 = this._rows[r2];
      if (row2.selected !== true) {
        continue;
      }

      var duplicateErrors = [];
      for (var c2 = 0; c2 < this._columns.length; c2++) {
        var col2 = this._columns[c2];
        if (col2.unique === true) {
          var keyValue = String(row2[col2.key] || "");
          if (keyValue && uniqueMaps[col2.key] && uniqueMaps[col2.key][keyValue] > 1) {
            duplicateErrors.push("Duplicate " + (col2.label || col2.key) + " in selected rows");
          }
        }
      }

      if (duplicateErrors.length > 0) {
        var found = false;
        for (var e = 0; e < errors.length; e++) {
          if (errors[e].rowIndex === r2) {
            errors[e].messages = errors[e].messages.concat(duplicateErrors);
            found = true;
            break;
          }
        }
        if (!found) {
          errors.push({
            tab: "manage",
            rowIndex: r2,
            rowId: row2.rowId,
            messages: duplicateErrors
          });
        }
      }
    }

    return { isValid: errors.length === 0, errors: errors };
  }

  _syncRowIds() {
    for (var i = 0; i < this._rows.length; i++) {
      this._rows[i].rowId = i + 1;
      if (this._rows[i].selected === undefined) {
        this._rows[i].selected = false;
      }
      if (this._rows[i].isModified === undefined) {
        this._rows[i].isModified = false;
      }
    }
  }

  _extractValue(src, field) {
    if (!src || !field) {
      return "";
    }

    if (src[field] !== undefined) {
      var item = src[field];
      if (item && typeof item === "object") {
        if (item.id !== undefined) return item.id;
        if (item.label !== undefined) return item.label;
        if (item.description !== undefined) return item.description;
        if (item.rawValue !== undefined) return item.rawValue;
      }
      return item;
    }

    return "";
  }

  _getRowOptionKeyByVisibleIndex(visibleIndex) {
    var actualIndex = this._getActualIndexFromVisibleIndex(visibleIndex);
    if (actualIndex < 0) {
      return "__row__" + String(visibleIndex);
    }
    return this._getRowOptionKey(actualIndex);
  }

  _getRowOptionKey(actualIndex) {
    var row = this._rows[actualIndex] || {};
    return row.rowId || row.employeeId || "__row__" + String(actualIndex);
  }

  _getOptionsForCell(rowIndex, fieldName) {
    var rowKey = this._getRowOptionKey(rowIndex);
    if (
      this._rowOptions[rowKey] &&
      this._rowOptions[rowKey][fieldName] &&
      Array.isArray(this._rowOptions[rowKey][fieldName])
    ) {
      return this._rowOptions[rowKey][fieldName];
    }
    return this._options[fieldName] || [];
  }

  _getOptionText(rowIndex, fieldName, value) {
    var list = this._getOptionsForCell(rowIndex, fieldName);
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].key) === String(value)) {
        return list[i].text !== undefined ? list[i].text : list[i].key;
      }
    }
    return value ? String(value) : "";
  }

  _isRowVisible(rowData) {
    var searchText = String(this._positionSearchText || "").toLowerCase().trim();
    if (!searchText) {
      return true;
    }

    for (var i = 0; i < this._columns.length; i++) {
      var key = this._columns[i].key;
      var value = String(rowData[key] || "").toLowerCase();
      if (value.indexOf(searchText) > -1) {
        return true;
      }
    }

    return false;
  }

  _rebuildFilteredIndexes() {
    this._filteredIndexes = [];
    for (var i = 0; i < this._rows.length; i++) {
      if (this._isRowVisible(this._rows[i])) {
        this._filteredIndexes.push(i);
      }
    }
    this._currentPage = 1;
  }

  _getTotalPages() {
    return this._filteredIndexes.length === 0 ? 1 : Math.ceil(this._filteredIndexes.length / this._pageSize);
  }

  _getPagedIndexes() {
    var start = (this._currentPage - 1) * this._pageSize;
    var end = start + this._pageSize;
    return this._filteredIndexes.slice(start, end);
  }

  _getActualIndexFromVisibleIndex(visibleIndex) {
    var paged = this._getPagedIndexes();
    if (visibleIndex >= 0 && visibleIndex < paged.length) {
      return paged[visibleIndex];
    }
    return -1;
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

  _setSafeAttribute(name, value) {
    this._suspendAttributeSync = true;
    this.setAttribute(name, value);
    this._suspendAttributeSync = false;
  }

  _setManageDataProperty() {
    this._setSafeAttribute("managedata", JSON.stringify(this._rows));
  }

  _setProperties() {
    this._setManageDataProperty();
    this._setSafeAttribute("lastevent", this._lastEvent || "");
    this._setSafeAttribute("validationresult", this._validationResult || "true");
    this._setSafeAttribute("validationerrors", JSON.stringify(this._validationErrors || []));
  }

  _dispatch(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  _fireReady() {
    this._lastEvent = "ready";
    this._setProperties();
    this._dispatch("onReady");
  }

  _fireFieldChange(rowIndex, fieldName, value) {
    this._lastEvent = "manageFieldChange|" + String(rowIndex) + "|" + String(fieldName) + "|" + String(value);
    this._setProperties();
    this._dispatch("onDataChange", {
      rowIndex: rowIndex,
      fieldName: fieldName,
      value: value
    });
  }

  _hasSelectedRows() {
    for (var i = 0; i < this._rows.length; i++) {
      if (this._rows[i].selected === true) {
        return true;
      }
    }
    return false;
  }

  _areAllVisibleRowsSelected() {
    var paged = this._getPagedIndexes();
    if (!paged.length) {
      return false;
    }
    for (var i = 0; i < paged.length; i++) {
      if (this._rows[paged[i]].selected !== true) {
        return false;
      }
    }
    return true;
  }

  _toggleSelectAllVisible(checked) {
    var paged = this._getPagedIndexes();
    for (var i = 0; i < paged.length; i++) {
      this._rows[paged[i]].selected = checked;
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

  _refreshToolbar() {
    var hasSelection = this._hasSelectedRows();
    var toolbarRight = this.shadowRoot.getElementById("toolbarRight");
    if (!toolbarRight) {
      return;
    }

    var btns = toolbarRight.querySelectorAll("[data-action='deleteSelected']");
    Array.prototype.forEach.call(btns, function(btn) {
      btn.style.display = hasSelection ? "" : "none";
    });
  }

  _updateVisibleCountText() {
    var visibleCountText = this.shadowRoot.getElementById("visibleCountText");
    if (visibleCountText) {
      visibleCountText.textContent = "Visible: " + this._filteredIndexes.length;
    }

    var pageInfo = this.shadowRoot.getElementById("pageInfo");
    if (pageInfo) {
      pageInfo.textContent = "Page " + this._currentPage + " of " + this._getTotalPages();
    }

    var loadMoreInfo = this.shadowRoot.getElementById("loadMoreInfo");
    if (loadMoreInfo) {
      var total = this._filteredIndexes.length;
      var start = total === 0 ? 0 : ((this._currentPage - 1) * this._pageSize) + 1;
      var end = Math.min(this._currentPage * this._pageSize, total);
      loadMoreInfo.textContent = "Showing " + start + " to " + end + " of " + total;
    }
  }

  _getRowErrorMap() {
    var map = {};
    for (var i = 0; i < this._validationErrors.length; i++) {
      map[this._validationErrors[i].rowIndex] = this._validationErrors[i].messages;
    }
    return map;
  }

  _render() {
    var styleHtml =
      '<style>' +
      ':host { display:block; font-family:"72", Arial, sans-serif; color:#223548; }' +
      '.wrap { border:1px solid #d9e2ef; border-radius:12px; background:#fff; overflow:hidden; }' +
      '.titleBar { padding:12px 14px; font-size:16px; font-weight:700; border-bottom:1px solid #e5edf7; background:#fff; }' +
      '.toolbarWrap { display:flex; justify-content:space-between; align-items:center; gap:10px; padding:12px; border-bottom:1px solid #e5edf7; background:#f8fbff; flex-wrap:wrap; }' +
      '.toolbarLeft { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }' +
      '.toolbarRight { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }' +
      '.searchBox { width:260px; max-width:100%; height:36px; border:1px solid #c7d7ea; background:#fff; color:#223548; border-radius:8px; padding:0 12px; font-size:13px; outline:none; }' +
      '.btn { border:1px solid #c7d7ea; background:#fff; color:#0a6ed1; border-radius:8px; padding:8px 14px; cursor:pointer; font-weight:600; font-size:13px; }' +
      '.btn.primary { background:#0a6ed1; color:#fff; border-color:#0a6ed1; }' +
      '.btn.danger { color:#bb1e1e; border-color:#efb4b4; background:#fff7f7; }' +
      '.gridWrap { overflow:auto; max-height:520px; background:#fff; }' +
      'table { border-collapse:separate; border-spacing:0; width:max-content; min-width:100%; }' +
      'th, td { border-bottom:1px solid #edf2f7; padding:8px; vertical-align:top; white-space:nowrap; box-sizing:border-box; }' +
      'th { position:sticky; top:0; background:#eef4fb; z-index:2; text-align:left; font-size:12px; color:#223548; font-weight:700; }' +
      'tr.errorRow td { background:#fff7f7; }' +
      'tr.modifiedRow td { background:#fffbeb; }' +
      '.cell { width:100%; box-sizing:border-box; min-height:34px; height:34px; border:1px solid #c9d6e5; border-radius:6px; padding:6px 10px; font-size:13px; background:#fff; color:#223548; outline:none; }' +
      '.cell.error, .dropdown-trigger.error { border-color:#e25555; background:#fff5f5; }' +
      '.readonly-cell { width:100%; min-height:34px; height:34px; border:1px solid #d6dee8; border-radius:6px; padding:6px 10px; font-size:13px; background:#f6f8fb; color:#425466; display:flex; align-items:center; box-sizing:border-box; }' +
      '.rowErr { margin-top:4px; font-size:11px; color:#c53030; white-space:normal; max-width:240px; line-height:1.3; }' +
      '.dropdown-trigger { width:100%; min-height:34px; height:34px; border:1px solid #c9d6e5; border-radius:6px; background:#fff; display:flex; align-items:center; justify-content:space-between; box-sizing:border-box; padding:0 10px; cursor:pointer; font-size:13px; color:#223548; user-select:none; }' +
      '.dropdown-trigger .label { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:8px; }' +
      '.dropdown-trigger .arrow { color:#6a7f94; font-size:11px; }' +
      '.row-checkbox { width:24px; height:24px; cursor:pointer; margin-top:6px; accent-color:#0a6ed1; }' +
      '.select-all-wrap { display:flex; align-items:center; gap:6px; }' +
      '.select-all-checkbox { width:18px; height:18px; cursor:pointer; accent-color:#0a6ed1; }' +
      '.muted { font-size:12px; color:#6b7c93; }' +
      '.pager { display:flex; justify-content:flex-end; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid #e5edf7; background:#fff; }' +
      '.empty-msg { padding:40px; text-align:center; color:#8a9bb0; font-size:14px; }' +
      '</style>';

    var html = '<div class="wrap">';
    html += '<div class="titleBar">' + this._escapeHtml(this._title) + '</div>';
    html += '<div class="toolbarWrap">';
    html += '<div class="toolbarLeft">';
    html += '<input id="positionSearchBox" class="searchBox" type="text" placeholder="' + this._escapeHtml(this._searchPlaceholder) + '" value="' + this._escapeHtml(this._positionSearchText) + '" />';
    html += '<span class="muted" id="visibleCountText">Visible: 0</span>';
    html += '</div>';
    html += '<div class="toolbarRight" id="toolbarRight">' + this._renderButtonsHtml() + '</div>';
    html += '</div>';
    html += '<div class="pager">';
    html += '<span class="muted" id="loadMoreInfo">Showing 0 to 0 of 0</span>';
    html += '<button class="btn" id="btnPrevPage">Previous</button>';
    html += '<span class="muted" id="pageInfo">Page 1 of 1</span>';
    html += '<button class="btn" id="btnNextPage">Next</button>';
    html += '</div>';
    html += '<div class="gridWrap">';
    html += '<table><thead><tr>';

    for (var i = 0; i < this._columns.length; i++) {
      var col = this._columns[i];
      if (col.key === "selected") {
        html += '<th style="width:' + (col.width || "70px") + '"><div class="select-all-wrap"><span>' + this._escapeHtml(col.label || "Sel") + '</span><input id="selectAll" class="select-all-checkbox" type="checkbox" /></div></th>';
      } else {
        html += '<th style="width:' + (col.width || "160px") + '">' + this._escapeHtml(col.label || col.key) + '</th>';
      }
    }

    html += '</tr></thead><tbody id="tbodyVirtual"></tbody></table></div></div>';

    this.shadowRoot.innerHTML = styleHtml + html;
    this._bindToolbarEvents();
  }

  _renderButtonsHtml() {
    var html = "";
    for (var i = 0; i < this._buttons.length; i++) {
      var btn = this._buttons[i];
      var css = "btn";
      if (btn.style === "primary") css += " primary";
      if (btn.style === "danger") css += " danger";
      html += '<button class="' + css + '" id="' + this._escapeHtml(btn.id || ("btn" + i)) + '" data-action="' + this._escapeHtml(btn.action || "") + '">' + this._escapeHtml(btn.text || "Button") + '</button>';
    }
    return html;
  }

  _bindToolbarEvents() {
    var that = this;

    var search = this.shadowRoot.getElementById("positionSearchBox");
    if (search) {
      search.addEventListener("input", function() {
        that._positionSearchText = search.value || "";
        that._rebuildFilteredIndexes();
        that._renderVisibleOnly();
        that._updateVisibleCountText();
      });
    }

    var prev = this.shadowRoot.getElementById("btnPrevPage");
    if (prev) prev.addEventListener("click", this._goToPreviousPage.bind(this));

    var next = this.shadowRoot.getElementById("btnNextPage");
    if (next) next.addEventListener("click", this._goToNextPage.bind(this));

    var selectAll = this.shadowRoot.getElementById("selectAll");
    if (selectAll) {
      selectAll.addEventListener("change", function() {
        that._toggleSelectAllVisible(selectAll.checked);
      });
    }

    var btns = this.shadowRoot.querySelectorAll(".toolbarRight button[data-action]");
    Array.prototype.forEach.call(btns, function(btn) {
      btn.addEventListener("click", function() {
        var action = btn.getAttribute("data-action") || "";
        if (typeof that[action] === "function") {
          that[action]();
        } else {
          that.triggerButtonAction(action);
        }
      });
    });
  }

  _renderVisibleOnly() {
    var tbody = this.shadowRoot.getElementById("tbodyVirtual");
    if (!tbody) return;

    var visibleIndexes = this._getPagedIndexes();
    var errorMap = this._getRowErrorMap();
    var html = "";

    if (visibleIndexes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="' + this._columns.length + '" class="empty-msg">No data to display.</td></tr>';
      return;
    }

    for (var i = 0; i < visibleIndexes.length; i++) {
      var actualIndex = visibleIndexes[i];
      var row = this._rows[actualIndex];
      var rowErrors = errorMap[actualIndex] || [];
      var rowClass = rowErrors.length ? "errorRow" : (row.isModified === true ? "modifiedRow" : "");

      html += '<tr class="' + rowClass + '">';
      for (var j = 0; j < this._columns.length; j++) {
        html += '<td style="width:' + (this._columns[j].width || "160px") + '">' + this._renderCell(row, actualIndex, this._columns[j], rowErrors) + '</td>';
      }
      html += '</tr>';
    }

    tbody.innerHTML = html;
    this._bindCellEvents();

    var selectAll = this.shadowRoot.getElementById("selectAll");
    if (selectAll) {
      selectAll.checked = this._areAllVisibleRowsSelected();
    }
  }

  _renderCell(row, rowIndex, col, rowErrors) {
    var cellValue = row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : "";
    var hasError = this._hasFieldError(col, rowErrors);
    var errorCss = hasError ? "error" : "";

    if (col.type === "checkbox") {
      return '<input class="row-checkbox" data-row="' + rowIndex + '" data-field="' + col.key + '" data-type="checkbox" type="checkbox" ' + (cellValue === true ? "checked" : "") + ' />';
    }

    if (col.type === "readonly") {
      return '<div class="readonly-cell" data-row="' + rowIndex + '" data-field="' + col.key + '" data-type="readonly">' + this._escapeHtml(String(cellValue)) + '</div>' + this._renderFieldErrors(col, rowErrors);
    }

    if (col.type === "select") {
      var displayText = this._getOptionText(rowIndex, col.key, cellValue);
      if (!displayText) displayText = cellValue ? String(cellValue) : "Select...";
      return '<div class="dropdown-trigger ' + errorCss + '" tabindex="0" data-row="' + rowIndex + '" data-field="' + col.key + '" data-type="select"><span class="label">' + this._escapeHtml(displayText) + '</span><span class="arrow">▼</span></div>' + this._renderFieldErrors(col, rowErrors);
    }

    var inputType = col.type === "date" ? "date" : "text";
    return '<input class="cell ' + errorCss + '" data-row="' + rowIndex + '" data-field="' + col.key + '" data-type="' + col.type + '" type="' + inputType + '" value="' + this._escapeHtml(String(cellValue)) + '" />' + this._renderFieldErrors(col, rowErrors);
  }

  _renderFieldErrors(col, rowErrors) {
    var out = [];
    for (var i = 0; i < rowErrors.length; i++) {
      if (rowErrors[i].toLowerCase().indexOf((col.label || col.key).toLowerCase()) > -1) {
        out.push(rowErrors[i]);
      }
    }
    return out.length ? '<div class="rowErr">' + out.join("<br>") + '</div>' : "";
  }

  _hasFieldError(col, rowErrors) {
    for (var i = 0; i < rowErrors.length; i++) {
      if (rowErrors[i].toLowerCase().indexOf((col.label || col.key).toLowerCase()) > -1) {
        return true;
      }
    }
    return false;
  }

  _bindCellEvents() {
    var that = this;
    var cellEls = this.shadowRoot.querySelectorAll("[data-row][data-field]");

    Array.prototype.forEach.call(cellEls, function(el) {
      var type = el.getAttribute("data-type");

      if (type === "checkbox") {
        el.addEventListener("change", function() {
          var rowIndex = parseInt(el.getAttribute("data-row"), 10);
          var fieldName = el.getAttribute("data-field");
          var value = el.checked;
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

      if (type === "select") {
        el.addEventListener("click", function(e) {
          e.stopPropagation();
          var rowIndex = parseInt(el.getAttribute("data-row"), 10);
          var fieldName = el.getAttribute("data-field");
          that._openDropdown(el, rowIndex, fieldName);
        });
        return;
      }

      if (type === "readonly") {
        return;
      }

      el.addEventListener("input", function() {
        var rowIndex = parseInt(el.getAttribute("data-row"), 10);
        var fieldName = el.getAttribute("data-field");
        that._rows[rowIndex][fieldName] = el.value;
        that._rows[rowIndex].isModified = true;
        that._validationErrors = [];
        that._validationResult = "true";
        that._setManageDataProperty();
      });

      el.addEventListener("change", function() {
        var rowIndex = parseInt(el.getAttribute("data-row"), 10);
        var fieldName = el.getAttribute("data-field");
        that._rows[rowIndex][fieldName] = el.value;
        that._rows[rowIndex].isModified = true;
        that._validationErrors = [];
        that._validationResult = "true";
        that._setProperties();
        that._fireFieldChange(rowIndex, fieldName, el.value);
      });
    });
  }

  _createDropdownPanel() {
    if (this._dropdownPanel) return;

    var panel = document.createElement("div");
    panel.className = "position-widget-dropdown-panel";
    panel.style.display = "none";
    panel.innerHTML =
      '<div class="dropdown-search-wrap"><input type="text" class="dropdown-search-input" placeholder="Search..." /></div>' +
      '<div class="dropdown-list"></div>';

    document.body.appendChild(panel);
    this._dropdownPanel = panel;
    this._dropdownSearch = panel.querySelector(".dropdown-search-input");
    this._dropdownList = panel.querySelector(".dropdown-list");

    var that = this;
    this._dropdownSearch.addEventListener("input", function() {
      that._renderDropdownItems(this.value);
    });

    this._documentClickHandler = function(e) {
      if (!that._dropdownOpen) return;
      var inPanel = that._dropdownPanel && that._dropdownPanel.contains(e.target);
      var inShadow = that.shadowRoot && that.shadowRoot.contains(e.target);
      if (!inPanel && !inShadow) {
        that._closeDropdown();
      }
    };

    document.addEventListener("click", this._documentClickHandler);
  }

  _openDropdown(triggerEl, rowIndex, fieldName) {
    this._activeDropdownTrigger = triggerEl;
    this._activeDropdownRow = rowIndex;
    this._activeDropdownField = fieldName;
    this._activeDropdownOptions = this._getOptionsForCell(rowIndex, fieldName) || [];
    this._activeDropdownSelectedKey = this._rows[rowIndex] ? this._rows[rowIndex][fieldName] : "";

    var rect = triggerEl.getBoundingClientRect();
    var width = Math.max(rect.width, 260);
    var left = rect.left;
    var top = rect.bottom + 4;

    if (left + width > window.innerWidth - 10) {
      left = window.innerWidth - width - 10;
    }
    if (left < 10) left = 10;

    this._dropdownPanel.style.display = "block";
    this._dropdownPanel.style.position = "fixed";
    this._dropdownPanel.style.left = left + "px";
    this._dropdownPanel.style.top = top + "px";
    this._dropdownPanel.style.width = width + "px";
    this._dropdownPanel.style.zIndex = "999999";

    this._dropdownSearch.value = "";
    this._renderDropdownItems("");
    this._dropdownOpen = true;

    var that = this;
    setTimeout(function() {
      if (that._dropdownSearch) that._dropdownSearch.focus();
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
    if (!this._dropdownList) return;

    var filtered = [];
    var search = String(searchText || "").toLowerCase().trim();

    for (var i = 0; i < this._activeDropdownOptions.length; i++) {
      var item = this._activeDropdownOptions[i];
      var key = item.key !== undefined ? String(item.key) : "";
      var text = item.text !== undefined ? String(item.text) : key;
      if (!search || (key + " " + text).toLowerCase().indexOf(search) > -1) {
        filtered.push({ key: key, text: text });
      }
    }

    this._dropdownList.innerHTML = "";

    if (!filtered.length) {
      this._dropdownList.innerHTML = '<div class="dropdown-empty">No results found</div>';
      return;
    }

    var that = this;

    for (var j = 0; j < filtered.length; j++) {
      var div = document.createElement("div");
      div.className = "dropdown-item" + (String(filtered[j].key) === String(this._activeDropdownSelectedKey) ? " selected" : "");
      div.textContent = filtered[j].text;
      div.setAttribute("data-key", filtered[j].key);

      div.addEventListener("mousedown", function(e) {
        e.preventDefault();
        var selectedKey = this.getAttribute("data-key");
        that._rows[that._activeDropdownRow][that._activeDropdownField] = selectedKey;
        that._rows[that._activeDropdownRow].isModified = true;
        that._validationErrors = [];
        that._validationResult = "true";
        that._setProperties();
        that._renderVisibleOnly();
        that._fireFieldChange(that._activeDropdownRow, that._activeDropdownField, selectedKey);
        that._closeDropdown();
      });

      this._dropdownList.appendChild(div);
    }
  }

  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

if (!customElements.get("com-example-dynamic-position-manage")) {
  customElements.define("com-example-dynamic-position-manage", DynamicPositionManageWidget);
}

(function() {
  if (document.getElementById("dynamic-position-widget-global-style")) {
    return;
  }

  var style = document.createElement("style");
  style.id = "dynamic-position-widget-global-style";
  style.textContent =
    '.position-widget-dropdown-panel{background:#fff;border:1px solid #cfd9e3;border-radius:8px;box-shadow:0 8px 24px rgba(34,53,72,0.18);overflow:hidden;min-width:220px;max-width:480px;max-height:340px;z-index:999999;font-family:"72", Arial, sans-serif;}' +
    '.position-widget-dropdown-panel .dropdown-search-wrap{padding:8px;border-bottom:1px solid #e8eef5;background:#fff;}' +
    '.position-widget-dropdown-panel .dropdown-search-input{width:100%;height:32px;border:1px solid #b9cae0;border-radius:6px;padding:0 10px;box-sizing:border-box;font-size:13px;outline:none;color:#223548;}' +
    '.position-widget-dropdown-panel .dropdown-list{max-height:280px;overflow:auto;background:#fff;}' +
    '.position-widget-dropdown-panel .dropdown-item{padding:9px 10px;font-size:13px;color:#223548;cursor:pointer;border-bottom:1px solid #f3f6f9;line-height:1.35;word-break:break-word;}' +
    '.position-widget-dropdown-panel .dropdown-item:hover{background:#edf5ff;}' +
    '.position-widget-dropdown-panel .dropdown-item.selected{background:#e8f2ff;color:#0a6ed1;font-weight:600;}' +
    '.position-widget-dropdown-panel .dropdown-empty{padding:12px;color:#7b8a9a;text-align:center;font-size:13px;}';

  document.head.appendChild(style);
})();
