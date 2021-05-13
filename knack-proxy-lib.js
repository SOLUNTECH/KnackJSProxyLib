/*
    Soluntech Library to Knack applications
    Dev <info@soluntech.com>
    Soluntech - 2020
    www.soluntech.com
*/

/**
 * Main class.
 * @constructor
 * @param {object} info - JS Object 
 * @param {string} info.applicationID - Proxy ID , 
 * @param {string} info.proxyURL - URL (optional), 
 * @param {string} info.jQuery - jQuery instance (optional), 
 * @param {string} info.environment - production/development (optional), 
 * @return {Soluntech}
 */
var Soluntech = function (info) {

  // Knack info
  this.applicationID = info.applicationID;
  this.proxyURL = info.proxyURL || 'https://proxy.soluntech.com/';
  this.jQuery = info.jQuery || window.$;

  // Environment info
  this.environment = info.environment || 'production';
  this.isProduction = this.environment === 'production';
  this.isDevelopment = this.environment === 'development';

  // Internal info
  this.$spinnerBackdrop = null;

  // External libraries
  this.libraries = info.libraries || {
    moment: {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.js',
      loaded: false,
      objectName: 'moment'
    },
    async: {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/async/2.4.1/async.min.js',
      loaded: false,
      objectName: 'async'
    },
    jquery: {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js',
      loaded: false,
      objectName: 'jQuery'
    },
    idleTimer: {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/jquery-idletimer/1.0.0/idle-timer.min.js',
      loaded: false,
      objectName: 'idleTimer'
    },
    chartjs: {
      url: 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.3/Chart.min.js',
      loaded: false,
      objectName: 'chartjs'
    }
  };

  // Check compatibility
  this.assert(Knack || window.Knack, 'Error, this library only run on Knack applications');
  this.assert(this.jQuery, 'Error, jQuery instance is required');
};

Object.defineProperty(Soluntech.prototype, '$', {
  get: function () {

    return window.jQuery || this.jQuery || window.$;
  }
});

Soluntech.prototype.set = function (key, value) {

  Object.defineProperty(Soluntech.prototype, key, {
    get: function () {

      return value;
    }
  });
};

Soluntech.prototype.log = function () {

  var args = Array.prototype.slice.call(arguments);
  if (console && typeof (console.log) === 'function' && this.isDevelopment) {
    console.log.apply(console, args);
  }
};

Soluntech.prototype.warn = function () {

  var args = Array.prototype.slice.call(arguments);
  if (console && typeof (console.warn) === 'function' && this.isDevelopment) {
    console.warn.apply(console, args);
  }
};

Soluntech.prototype.error = function () {

  var args = Array.prototype.slice.call(arguments);
  if (console && typeof (console.error) === 'function' && this.isDevelopment) {
    console.error.apply(console, args);
  }
};

Soluntech.prototype.debug = function () {

  var args = Array.prototype.slice.call(arguments);
  if (console && typeof (console.debug) === 'function' && this.isDevelopment) {
    console.debug.apply(console, args);
  }
};

Soluntech.prototype.assert = function (cond, message) {

  if (!cond) {
    throw new Error(message);
  }
};

Object.defineProperty(Soluntech.prototype, 'headers', {
  get: function () {

    return {
      'S-PROXY-APPID': this.applicationID,
      'content-type': 'application/json'
    };
  }
});

Soluntech.prototype.next = function (tick) {

  setTimeout(function () { tick() }, 0);
};

/**
 * Shows Knack spinnet
 * @param {function} callback - Callback function (optional)
 */
Soluntech.prototype.showSpinner = function (callback) {

  if (this.$spinnerBackdrop) {
    return;
  }

  this.$spinnerBackdrop = this.$(
    '<div style="z-index: 100000; position: absolute; top: 0; left: 0; right: 0; bottom: 0;">' +
    '</div>'
  );
  this.$spinnerBackdrop.appendTo('body');

  // wait for next tick
  this.next(function () {

    Knack.showSpinner();

    if (typeof callback === 'function') {
      callback();
    }
  });
};

/**
 * Hides Knack spinnet
 * @param {function} callback - Callback function (optional)
 */
Soluntech.prototype.hideSpinner = function (callback) {

  if (this.$spinnerBackdrop) {
    this.$spinnerBackdrop.remove();
    this.$spinnerBackdrop = null;
  }

  this.next(function () {

    Knack.hideSpinner();

    if (typeof callback === 'function') {
      callback();
    }
  });
};

/**
 * This function is called by {@link  Soluntech#loadLibrary loadLibrary}
 * @param {array} libs - Ref name
 * @param {function} callback - Callback function
 */
Soluntech.prototype.load = function (libs, callback) {

  var self = this;

  LazyLoad.js(libs, function () {

    callback.call(self);
  });
};

/**
 * Loads JS libraries
 * @param {array} libs - Ref name
 * @param {function} callback - Callback function
 */
Soluntech.prototype.loadLibrary = function () {

  var args = Array.prototype.slice.call(arguments);
  var callback = args.pop();
  var libs = [];
  var _library;
  var self = this;

  args.forEach(function (library) {

    _library = self.libraries[library];

    if (_library && !_library.loaded) {
      _library.loaded = true;
      libs.push(_library.url);
    }
  });

  if (!libs.length) {
    return callback.call(this);
  }

  this.load(libs, callback);
};

/**
 * Validates if a library is loaded
 * @param {string} libraryName - Ref name
 * @return {boolean}
 */
Soluntech.prototype.libraryIsLoaded = function (libraryName) {

  var library = this.libraries[libraryName];

  if (!library) {
    return false;
  }

  return library.loaded;
};

/**
 * Add a new JS library to be loaded with {@link loadLibrary}
 * @param {string} libraryName - Ref name
 * @param {string} url - CDN library url
 */
Soluntech.prototype.insertLibrary = function (libraryName, url) {

  var library = this.libraries[libraryName];

  if (library) {
    return;
  }

  this.libraries[libraryName] = {
    url: url,
    loaded: false
  };
};

/**
 * Add a new Knack event listener
 * @param {string} desc - Short description
 * @param {string} event - Knack event
 * @param {function} task - Function that will be executed
 */
Soluntech.prototype.addTask = function (desc, event, task) {

  this.$(document).on(event, task.bind(this));
};

/**
 * Add a new function
 * @param {string} name - Function mane
 * @param {function} func - Function that will be executed
 */
Soluntech.prototype.addMethod = function (name, func) {

  Object.defineProperty(Soluntech.prototype, name, {
    get: function () {

      return func.bind(this);
    }
  });
};

Soluntech.prototype.librariesRequired = function () {

  var args = Array.prototype.slice.call(arguments);
  var self = this;
  var library;

  args.forEach(function (libraryName) {

    library = self.libraries[libraryName];

    self.assert(library, 'Library "' + libraryName + '" don\' exists');
    self.assert(window[library.objectName], 'Library "' + libraryName + '" is required');
  });
};

/**
 * Finds an existing records in database 
 * @param {string} objectId - Database object ID
 * @param {array} filters - Objects array
 * @param {string} sortField - Sort field ID  (optional)
 * @param {string} sortOrder - Sort order asc|desc (optional)
 * @param {number} recordPerPage - Amount of records to fetch per page (optional)
 * @return {promise}
 */
Soluntech.prototype.find = function (objectId, filters, sortField, sortOrder, recordPerPage) {

  filters = filters || [];
  sortOrder = sortOrder || '';
  sortField = sortField || '';
  recordPerPage = recordPerPage || 'all';

  var filterValEnc = encodeURIComponent(JSON.stringify(filters));
  var sortFEnc = encodeURIComponent(sortField);
  var sortOEnc = encodeURIComponent(sortOrder);

  var dfd = $.Deferred();

  $.ajax({
    type: 'GET',
    headers: this.headers,
    url: this.proxyURL + 'objects/' + objectId + '/records?rows_per_page=' + recordPerPage +
      '&filters=' + filterValEnc + "&sort_field=" + sortFEnc + "&sort_order=" +
      sortOEnc,
    triedCount: 0,
    retryLimit: 3,
    error: function (xhr, textStatus, errorThrown) {
      console.log("error: " + this.triedCount);
      this.triedCount++;
      if (this.triedCount < this.retryLimit && xhr.status >= 500) {
        console.log(this);
        $.ajax(this);
      } else {
        dfd.reject(xhr);
      }
    },
    success: function (response) {
      dfd.resolve(response);
    }
  });

  return dfd.promise();
};

/**
 * Finds by ID an existing record in database 
 * @param {string} objectId - Database object ID
 * @param {string} id - Record ID
 * @return {promise}
 */
Soluntech.prototype.findById = function (objectId, id) {

  var dfd = $.Deferred();

  $.ajax({
    type: 'GET',
    headers: this.headers,
    url: this.proxyURL + 'objects/' + objectId + '/records/' + id,
    triedCount: 0,
    retryLimit: 3,
    error: function (xhr, textStatus, errorThrown) {
      console.log("error: " + this.triedCount);
      this.triedCount++;
      if (this.triedCount < this.retryLimit && xhr.status >= 500) {
        console.log(this);
        $.ajax(this);
      } else {
        dfd.reject(xhr);
      }
    },
    success: function (response) {
      dfd.resolve(response);
    }
  });

  return dfd.promise();
};

/**
 * Updates an existing record in database
 * @param {string} objectId - Database object ID
 * @param {string} id - Record ID
 * @param {json} data - JSON data
 * @return {promise}
 */
Soluntech.prototype.update = function (objectId, id, data) {

  var dfd = $.Deferred();

  $.ajax({
    type: 'PUT',
    headers: this.headers,
    url: this.proxyURL + 'objects/' + objectId + '/records/' + id,
    data: data,
    triedCount: 0,
    retryLimit: 3,
    error: function (xhr, textStatus, errorThrown) {
      console.log("error: " + this.triedCount);
      this.triedCount++;
      if (this.triedCount < this.retryLimit && xhr.status >= 500) {
        console.log(this);
        $.ajax(this);
      } else {
        dfd.reject(xhr);
      }
    },
    success: function (response) {
      dfd.resolve(response);
    }
  });

  return dfd.promise();
};

/**
 * Deletes a new record in database
 * @param {string} objectId - Database object ID
 * @param {string} id - Record ID
 * @return {promise}
 */
Soluntech.prototype.delete = function (objectId, id) {

  var dfd = $.Deferred();

  $.ajax({
    type: 'DELETE',
    headers: this.headers,
    url: this.proxyURL + 'objects/' + objectId + '/records/' + id,
    triedCount: 0,
    retryLimit: 3,
    error: function (xhr, textStatus, errorThrown) {
      console.log("error: " + this.triedCount);
      this.triedCount++;
      if (this.triedCount < this.retryLimit && xhr.status >= 500) {
        console.log(this);
        $.ajax(this);
      } else {
        dfd.reject(xhr);
      }
    },
    success: function (response) {
      dfd.resolve(response);
    }
  });

  return dfd.promise();
};

Soluntech.prototype.deleteMultiple = function (objectId, info, callback) {

  var filters = info.filters || [];
  var sortOrder = info.sortOrder || '';
  var sortField = info.sortField || '';
  var recordPerPage = info.recordPerPage || 'all';

  var filterValEnc = encodeURIComponent(JSON.stringify(filters));
  var sortFEnc = encodeURIComponent(sortField);
  var sortOEnc = encodeURIComponent(sortOrder);
  var self = this;

  self.$.ajax({
    type: 'GET',
    headers: self.headers,
    url: self.proxyURL + 'objects/' + objectId + '/records?rows_per_page=' + recordPerPage +
      '&filters=' + filterValEnc + "&sort_field=" + sortFEnc + "&sort_order=" +
      sortOEnc
  })
    .then(function (response) {

      var ids = response.records.map(function (record) {

        return record.id;
      });

      if (!ids.length) {
        return null;
      }

      return self.$.ajax({
        type: 'POST',
        headers: self.headers,
        url: self.proxyURL + 'objects/' + objectId + '/records/delete',
        data: {
          ids: ids
        }
      });
    })
    .then(function (response) {

      callback(null, response);
      return null;
    })
    .fail(callback)
};

Soluntech.prototype.enableElement = function (selector) {

  var $element = this.$(selector);

  if ($element && $element.length) {
    $element.removeAttr('disabled');
  }
};

Soluntech.prototype.disableElement = function (selector) {

  var $element = this.$(selector);

  if ($element && $element.length) {
    $element.attr('disabled', 'disabled');
  }
};

/**
 * Creates a new record in database
 * @param {string} objectId - Database object ID
 * @param {json} data - JSON data
 * @return {promise}
 */
Soluntech.prototype.create = function (objectId, data) {

  var dfd = $.Deferred();

  $.ajax({
    type: 'POST',
    headers: this.headers,
    url: this.proxyURL + 'objects/' + objectId + '/records',
    data: data,
    triedCount: 0,
    retryLimit: 3,
    error: function (xhr, textStatus, errorThrown) {
      console.log("error: " + this.triedCount);
      this.triedCount++;
      if (this.triedCount < this.retryLimit && xhr.status >= 500) {
        console.log(this);
        $.ajax(this);
      } else {
        dfd.reject(xhr);
      }
    },
    success: function (response) {
      dfd.resolve(response);
    }
  });

  return dfd.promise();
};

/**
 * Uploads a file to Knack's S3 Bucket
 * @param {string} type - File type
 * @param {blob} blob - File blob
 * @param {string} filename - Filename with extension (optional)
 * @return {promise}
 */
Soluntech.prototype.upload = function (type, blob, filename) {

  var dfd = $.Deferred();
  var upload_headers = this.headers;
  delete upload_headers['content-type'];

  var fd = new FormData();

  if (filename) {
    fd.append('files', blob, filename);
  }
  else {
    fd.append('files', blob);
  }

  $.ajax({
    type: 'POST',
    headers: upload_headers,
    url: this.proxyURL + 'applications/' + this.applicationID + '/assets/' + type + '/upload',
    data: fd,
    processData: false,
    contentType: false,
    triedCount: 0,
    retryLimit: 3,
    error: function (xhr, textStatus, errorThrown) {
      console.log("error: " + this.triedCount);
      this.triedCount++;
      if (this.triedCount < this.retryLimit && xhr.status >= 500) {
        console.log(this);
        $.ajax(this);
      } else {
        dfd.reject(xhr);
      }
    },
    success: function (response) {
      dfd.resolve(response);
    }
  });

  return dfd.promise();
};

/**
 * Get value from a field in a record object
 * @param {object} object - Record object from database
 * @param {string} field - Field ID
 * @param {string} type - Field type
 */
Soluntech.prototype.getFieldValue = function (object, field, type) {

  if (!object) {
    return object;
  }

  if (type === 'raw' || type === 'number') {
    return object[field + '_raw'];
  }

  if (type === 'date') {
    var val = object[field + '_raw'];
    var nullVal = {};

    if (!val) {
      return nullVal;
    }

    return val;
  }

  if (type === 'name') {
    var val = object[field + '_raw'];
    var nullVal = { first: '', last: '' };

    if (!val) {
      return nullVal;
    }

    return val;
  }

  if (type === 'email') {
    var val = object[field + '_raw'];

    return val && val.email;
  }

  if (type === 'image' || type === 'file') {
    var val = object[field + '_raw'];
    var nullVal = { url: '' };

    if (!val) {
      return nullVal;
    }

    return val;
  }

  if (type === 'address') {
    var val = object[field + '_raw'];
    var nullVal = { city: '', state: '', stree: '', street2: '', zip: '' };

    if (!val) {
      return nullVal;
    }

    return val;
  }

  if (type === 'connection') {
    var val = object[field + '_raw'];
    var nullVal = { id: null, identifier: '' };

    if (!val) {
      return nullVal;
    }

    if (Array.isArray(val)) {
      if (val.length < 1) {
        return nullVal;
      }

      return val.length === 1 ? val[0] : val;
    }

    return val;
  }

  return object[field];
};

/**
 * Validates if a string is a valid ID
 * @param {string} str - ID
 * @return {boolean}
 */
Soluntech.prototype.valueIsId = function (str) {

  str = str + '';

  var len = str.length;
  var isId = false;

  if (len == 12 || len == 24) {
    isId = /^[0-9a-fA-F]+$/.test(str);
  }

  return isId;
};

Soluntech.prototype.updateQueryStringParameter = function (key, value, uri) {

  uri = uri || window.location.href;
  var re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
  var separator = uri.indexOf('?') !== -1 ? '&' : '?';

  if (uri.match(re)) {
    return uri.replace(re, '$1' + key + '=' + value + '$2');
  }
  else {
    return uri + separator + key + '=' + value;
  }
};

Soluntech.prototype.updateLocationWithoutReloading = function (newUrl) {

  if (window.history.pushState) {
    window.history.pushState({
      path: newUrl
    }, '', newUrl);
  }
};

Soluntech.prototype.getParameterByName = function (name, uri) {

  uri = uri || window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');

  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  var results = regex.exec(uri);

  if (!results) {
    return null;
  }

  if (!results[2]) {
    return '';
  }

  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Updates an existing instructions element
 * @param {string} divField - Container div jQuery selector
 * @param {string} content - Message
 * @param {string} color - Text, HEX or RGB/A (optional)
 */
Soluntech.prototype.showInstructions = function (divField, content, color) {

  var self = this;
  var $knInstructions = self.$(divField).find('p.kn-instructions');

  color = color || 'black';

  $knInstructions.html(content);
  $knInstructions.css('color', color);
  $knInstructions.show();
};

/**
 * Hide instructions element
 * @param {string} divField - Container div jQuery selector
 */
Soluntech.prototype.hideInstructions = function (divField) {

  var self = this;

  var $knInstructions = self.$(divField).find('p.kn-instructions');

  $knInstructions.html('');
  $knInstructions.hide();
};

/**
 * Reload a view visible in the DOM
 * @param {string} view - ID of the view
 * @param {function} callback - Callback function (optional)
 */
Soluntech.prototype.refreshView = function (view, done) {

  done = done || function () { };

  try {
    Knack.views[view].model.fetch({
      success: function () {
        Knack.views[view].render();
        done();
      }
    });

  }
  catch (e) {
    done(e);
  }
};

/**
 * Remove an element if exists in the DOM
 * @param {string} selector - jQuery selector string 
 * @return {boolean}
 */
Soluntech.prototype.removeIfIsInDOM = function (selector) {

  var self = this;
  var $selector = self.$(selector);

  if ($selector && $selector.length) {
    $selector.remove();
    return true;
  }

  return false;
};

/**
 * Validate if there is an authenticated user
 * @return {boolean}
 */
Soluntech.prototype.isAuthenticated = function () {

  return !Knack.user.id ? false : true;
};

Soluntech.prototype.startIdleTimer = function (userOptions) {

  var options = {
    selector: document,
    timeout: 300000,    // 5 mins
    idle: false,
    userGoesIdleCallback: function () { },
    userBecomesActive: function () { }
  };
  var self = this;

  self.$.extend(options, userOptions || {});
  self.loadLibrary('jquery', 'idleTimer', function () {

    self.$(options.selector).idleTimer({
      idle: options.idle,
      timeout: options.timeout
    });

    self.$(options.selector).on('idle.idleTimer', function (event, elem, obj) {

      options.userGoesIdleCallback(event, elem, obj);
    });

    self.$(options.selector).on('active.idleTimer', function (event, elem, obj, triggerevent) {

      options.userBecomesActive(event, elem, obj, triggerevent);
    });
  });
};

Soluntech.prototype.updateIdleTimer = function (userOptions) {

  var options = {
    selector: document,
    event: 'destroy'
  };
  var self = this;

  self.$.extend(options, userOptions || {});
  self.loadLibrary('jquery', 'idleTimer', function () {

    self.$(options.selector).idleTimer(options.event);
    self.$(options.selector).off('idle.idleTimer');
    self.$(options.selector).off('active.idleTimer');
  });
};

/**
 * Triggers the Knack's logout
 */
Soluntech.prototype.logout = function () {

  var link = document.getElementsByClassName('kn-log-out');

  if (link && link[0]) {
    link[0].click();
  }
};