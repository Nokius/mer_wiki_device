/* Any JavaScript here will be loaded for all users on every page load. */

var filters = {
  basic: {
    vendor: "vendor",
    type: "type",
    sfosversions: "SFOS versions"
  },
  advanced: { // advanced filters have to be expanded to be seen 
    ram: "RAM",
    soc: "SoC",
    cpucores: "CPU cores",
    cpufreq: "CPU frequency",
    screendimension: "screen dimension"
  }
};

// default filter
var default_hash_string = 'vendor=;';

var prefixes = ["some text here that (hopefully) never will be part of a value", "M", "G", "T"];

// you can add your own sort funtion to sort items in the dropdowns
var sort_functions = {
  /*type: function(a, b) {
    var values = ["phone", "phablet", "tablet"]; // all other types will be appended behind these
    a_val = values.indexOf(a);
    b_val = values.indexOf(b);
    return (a_val == -1 ? 2147483647 : a_val) - (b_val == -1 ? 2147483647 : b_val);
  },*/
  cpucores: function(a, b) {
    var values = ["single", "dual", "tri", "quad", "penta", "hexa", "octo"];
    return values.indexOf(a) - values.indexOf(b);
  },
  sfosversions: function(a, b) {
    return (a - b);
  },
  cpufreq: function(a, b) {
    var a_val = parseFloat(a);
    var b_val = parseFloat(b);
    
    if (isNaN(a_val)) {
      return 1;
    }
    if (isNaN(b_val)) {
      return -1;
    }
    
    var i = 0;
    while (prefixes[i] && a.indexOf(prefixes[i]) == -1) {
      a_val *= 1000;
      i++;
    }
    
    i = 0;
    while (prefixes[i] && b.indexOf(prefixes[i]) == -1) {
      b_val *= 1000;
      i++;
    }
    
    return (a_val - b_val);
  },
  screendimension: function(a, b) {
    var a_val = parseFloat(a);
    var b_val = parseFloat(b);
    
    if (isNaN(a_val)) {
      return 1;
    }
    if (isNaN(b_val)) {
      return -1;
    }
    
    return (a_val - b_val);
  }
};
sort_functions.ram = sort_functions.cpufreq;


// no need to edit something behind this 

/*** utility functions ***/

// from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(searchElement /*, fromIndex */ ) {
    "use strict";
    if (this == null) {
      throw new TypeError();
    }
    var t = Object(this);
    var len = t.length >>> 0;
    if (len === 0) {
      return -1;
    }
    var n = 0;
    if (arguments.length > 1) {
      n = Number(arguments[1]);
      if (n != n) { // shortcut for verifying if it's NaN
        n = 0;
      } else if (n != 0 && n != Infinity && n != -Infinity) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
      }
    }
    if (n >= len) {
      return -1;
    }
    var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
    for (; k < len; k++) {
      if (k in t && t[k] === searchElement) {
        return k;
      }
    }
    return -1;
  };
}

// Array Remove - by John Resig (MIT Licensed), from http://ejohn.org/blog/javascript-array-remove/
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

function findPos(obj) {
  var curleft = 0;
  var curtop = 0;
  
  if (obj.offsetParent) {
    do {
      curleft += obj.offsetLeft;
      curtop += obj.offsetTop;
    }
    while (obj = obj.offsetParent);
  }
		
		return {left: curleft, top: curtop};
}

function clickElement($elem) {
  if ($elem.click) {
     $elem.click();
  }
  else {
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    $elem.dispatchEvent(evt);
  }
}

// from http://davidwalsh.name/javascript-clone
function clone (src) {
  function mixin (dest, source, copyFunc) {
    var name, s, i, empty = {};
    for (name in source) {
      // the (!(name in empty) || empty[name] !== s) condition avoids copying properties in "source"
      // inherited from Object.prototype.   For example, if dest has a custom toString() method,
      // don't overwrite it with the toString() method that source inherited from Object.prototype
      s = source[name];
      if (!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))) {
        dest[name] = copyFunc ? copyFunc(s) : s;
      }
    }
    return dest;
  }

  if (!src || typeof src != "object" || Object.prototype.toString.call(src) === "[object Function]") {
    // null, undefined, any non-object, or function
    return src;  // anything
  }
  if (src.nodeType && "cloneNode" in src) {
    // DOM Node
    return src.cloneNode(true); // Node
  }
  if (src instanceof Date) {
    // Date
    return new Date(src.getTime());  // Date
  }
  if (src instanceof RegExp) {
    // RegExp
    return new RegExp(src);   // RegExp
  }
  var r, i, l;
  if (src instanceof Array) {
    // array
    r = [];
    for (i = 0, l = src.length; i < l; ++i) {
      if (i in src) {
        r.push(clone(src[i]));
      }
    }
    // we don't clone functions for performance reasons
    //    }else if(d.isFunction(src)){
    //      // function
    //      r = function(){ return src.apply(this, arguments); };
  }
  else {
    // generic objects
    r = src.constructor ? new src.constructor() : {};
  }
  return mixin(r, src, clone);
}

function isEmpty(o) {
  for (var p in o) { 
    if (!o.hasOwnProperty || o.hasOwnProperty(p))
      return false;
  }
  return true;
}

function listen(el, evnt, func, bubble) {
  if (el.addEventListener) { // W3C DOM
    el.addEventListener(evnt, func, bubble ? true : false);
  }
  else if (el.attachEvent) { // IE DOM
    el.attachEvent("on"+evnt, func);
  }
}

function unlisten(el, evnt, func, bubble) {
  if (el.removeEventListener) { // W3C DOM
    el.removeEventListener(evnt, func, bubble ? true : false);
  }
  else if (el.detachEvent) { // IE DOM
    el.detachEvent("on"+evnt, func);
  }
}

/*!
* contentloaded.js
*
* Author: Diego Perini (diego.perini at gmail.com)
* Summary: cross-browser wrapper for DOMContentLoaded
* Updated: 20101020
* License: MIT
* Version: 1.2
*
* URL:
* http://javascript.nwbox.com/ContentLoaded/
* http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
*
*/

// @win window reference
// @fn function reference
function contentLoaded(win, fn) {
  var done = false, top = true,
  
  doc = win.document, root = doc.documentElement,
  
  add = doc.addEventListener ? 'addEventListener' : 'attachEvent',
  rem = doc.addEventListener ? 'removeEventListener' : 'detachEvent',
  pre = doc.addEventListener ? '' : 'on',
  
  init = function(e) {
    if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
    (e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
    if (!done && (done = true)) fn.call(win, e.type || e);
  },
  
  poll = function() {
    try { root.doScroll('left'); } catch(e) { setTimeout(poll, 50); return; }
    init('poll');
  };
  
  if (doc.readyState == 'complete') fn.call(win, 'lazy');
  else {
    if (doc.createEventObject && root.doScroll) {
    try { top = !win.frameElement; } catch(e) { }
    if (top) poll();
  }
  doc[add](pre + 'DOMContentLoaded', init, false);
  doc[add](pre + 'readystatechange', init, false);
  win[add](pre + 'load', init, false);
  }
}


/*** end utlility functions */


var filter_data = {};
var all_filter_data;
var $filter;
var $devices;
var $emptyNote;
var closeListener;
var oldHref;

function init_device_filter() {
  if (document.getElementById("sfosDeviceFilterList").length == 0)
    return;
  
  // fill filter_data with empty arrays for each filter
  for (var category in filters) {
    for (var key in filters[category]) {
      filter_data[key] = [];
    }
  }
  
  $devices = [];
  
  var $devices_children = document.getElementById("sfosDeviceFilterList").childNodes;
  for (var i=0; i<$devices_children.length; i++) {
    if ($devices_children[i].className && $devices_children[i].className.match(/\bdevice\b/)) {
      $devices.push($devices_children[i]);
    }
  }
  
  $filter = document.createElement("div");
  $filter.id = "sfosFilter";
  $filter.innerHTML = '<label>Filter: <span class="holoInput"><input type="text/css" placeholder="search query" id="filter_devices" /></span></label>';
  document.getElementById("sfosDeviceFilterList").parentNode.insertBefore($filter, document.getElementById("sfosDeviceFilterList"));
  
  $emptyNote = document.getElementById("sfosDeviceFilterEmptyNote");
  
  
  // search query filtering
  listen(document.getElementById("filter_devices"), "keyup", function(e) {
    filter_data.searchable = this.value.toLowerCase();
    refilter_devices();
  });
  listen(document.getElementById("filter_devices"), "change", function(e) {
    filter_data.searchable = this.value.toLowerCase();
    update_location_hash();
  });
  
  
  // get all possible values for the dropdown filters
  for (var i=0; i<$devices.length; i++) {
    for (var key in filter_data) {
      var value = $devices[i].getAttribute("data-" + key);
      
      if (value == "") {
        $devices[i].setAttribute("data-" + key, "N/A");
        value = "N/A";
      }
      
      if (key == "sfosversions") {
        //var versions = value.split(/,?\s+/);
		var versions = value.split(",");
        for (var k=0; k<versions.length; k++) {
          if (filter_data[key].indexOf(versions[k]) == -1) {
            filter_data[key].push(versions[k]);
          }
        }
      }
      else {
        if (filter_data[key].indexOf(value) == -1) {
          filter_data[key].push(value);
        }
      }
    }
  }
  
  // sort all filter data
  for (var key in filter_data) {
    if (typeof sort_functions[key] !== "undefined")
      filter_data[key].sort(sort_functions[key]);
    else
      filter_data[key].sort();
  }
  
  // add dropdown menus
  for (var category in filters) {
    var $parent;
    
    if (category == "advanced") {
      var $allDevicesButton = document.createElement("a");
      $allDevicesButton.href = "#";
      $allDevicesButton.id = "allDevicesButton";
      $allDevicesButton.innerHTML = "show all devices";
      listen($allDevicesButton, "click", function(e) {
        e.preventDefault();
        
        filter_data = clone(all_filter_data);
        update_location_hash();
        
        return false;
      });
      $filter.appendChild($allDevicesButton);
      
      if (!isEmpty(filters[category])) {
        $filter.appendChild(document.createElement("br"));
        
        var $button = document.createElement("a");
        $button.href = "#";
        $button.id = "advancedButton";
        $button.innerHTML = "advanced filters";
        listen($button, "click", function(e) {
          e.preventDefault();
          
          this.className = (this.className == "expanded") ? "collapsed" : "expanded";
          this.nextSibling.className = (this.nextSibling.className == "expanded") ? "collapsed" : "expanded";
          this.blur();
          
          return false;
        });
        $filter.appendChild($button);
        
        $parent = document.createElement("div");
        $parent.id = "advancedFilters";
        $parent.className = "collapsed";
        $filter.appendChild($parent);
      }
    }
    else {
      $parent = $filter;
    }
    
    for (var key in filters[category]) {
      var $dropdown = document.createElement("a");
      $dropdown.href = "#";
      $dropdown.className = "dropdown";
      $dropdown.innerHTML = '<b>' + filters[category][key] + "</b><span>" + filter_data[key].length + "</span>/" + filter_data[key].length;
      listen($dropdown, "click", function(e) {
        e.preventDefault();
        
        var $dropdown = this;
        var $menu = this.nextSibling
        
        if ($menu.style.display == 'block') {
          // hide it now
          $menu.style.display = '';
          
          this.removeAttribute('data-active');
        }
        else {
          this.setAttribute('data-active', 'true');
          
          var position = findPos(this);
          var parentPosition = findPos(this.parentNode);
          $menu.style.display = 'block';
          $menu.style.position = 'absolute';
          $menu.style.top = position.top - parentPosition.top + this.offsetHeight - 1 + 'px';
          $menu.style.left = position.left - parentPosition.left + 'px';
          
          // capture click event to close menu on click anywhere else on the page
          closeListener = function(e) {
            var currElem = e.target;
            
            // go through all of e.target's parentNodes 
            while (currElem != null && currElem != document.body) {
              if (currElem == $menu) {
                return;
              }
              if (currElem == $dropdown) {
                unlisten(document, "click", closeListener, true);
                return;
              }
              
              currElem = currElem.parentNode;
            }
            
            clickElement($dropdown);
            
            unlisten(document, "click", closeListener, true);
          };
          listen(document, "click", closeListener, true);
        }
        this.blur();
        
        return false;
      });
      
      $parent.appendChild($dropdown);
      
      var $menu = document.createElement("ul");
      $menu.className = "dropdownMenu";
      $menu.setAttribute("data-filter", key);
      $parent.appendChild($menu);
      
      // all and none buttons
      var $li = document.createElement("li");
      $li.className = "buttons";
      
      var $all = document.createElement("a");
      $all.href = "#";
      $all.innerHTML = "all";
      listen($all, "click", function(e) {
        e.preventDefault();
        
        var $ul = this.parentNode.parentNode.parentNode;
        var key = $ul.getAttribute("data-filter");
        filter_data[key] = clone(all_filter_data[key]);
        
        var $checkedCnt = $ul.previousSibling.getElementsByTagName("span")[0];
        var value = all_filter_data[key].length;
        $checkedCnt.innerHTML = value;
        $checkedCnt.className = "selected-" + value;
        
        var $currElem = this.parentNode.parentNode;
        while ($currElem = $currElem.nextSibling) {
          $currElem.className = "checked";
        }
        this.blur();
        
        update_location_hash();
        
        return false;
      });
      
      var $none = document.createElement("a");
      $none.href = "#";
      $none.innerHTML = "none";
      listen($none, "click", function(e) {
        e.preventDefault();
        
        var $ul = this.parentNode.parentNode.parentNode;
        var key = $ul.getAttribute("data-filter");
        filter_data[key] = [];
        
        var $checkedCnt = $ul.previousSibling.getElementsByTagName("span")[0];
        $checkedCnt.innerHTML = "0";
        $checkedCnt.className = "selected-0";
        
        var $currElem = this.parentNode.parentNode;
        while ($currElem = $currElem.nextSibling) {
          $currElem.className = "";
        }
        this.blur();
        
        update_location_hash();
        
        return false;
      });
      
      var $span = document.createElement("span");
      $span.appendChild($all);
      $li.appendChild($span);
      
      $span = document.createElement("span");
      $span.appendChild($none);
      $li.appendChild($span);
      
      $menu.appendChild($li);
      
      for (var i=0; i<filter_data[key].length; i++) {
        $li = document.createElement("li");
        $li.className = "checked";
        $li.setAttribute("data-value", filter_data[key][i]);
        $li.innerHTML = filter_data[key][i];
        
        listen($li, "click", function(e) {
          var key = this.parentNode.getAttribute("data-filter");
          var $checkedCnt = this.parentNode.previousSibling.getElementsByTagName("span")[0];
          var value = parseInt($checkedCnt.innerHTML);
          
          if (this.className.indexOf("checked") == -1) { // unchecked, now checked
            this.className = "checked";
            filter_data[key].push(this.getAttribute("data-value"));
            $checkedCnt.innerHTML = ++value;
          }
          else { // checked, now unchecked
            this.className = "";
            filter_data[key].remove(filter_data[key].indexOf(this.getAttribute("data-value")));
            $checkedCnt.innerHTML = --value;
          }
          $checkedCnt.className = "selected-" + value;
          
          update_location_hash();
        });
        
        $menu.appendChild($li);
      }
    }
  }
  
  
  // create active filters
  // standard = all on, so we can use filter_data
  // just add the search query thing
  filter_data.searchable = "";
  
  all_filter_data = clone(filter_data);
  
  
  if (location.hash == "" || location.hash == "#") {
    location.hash = default_hash_string;
  }
  
  // react on hash changes
  // from http://stackoverflow.com/a/9339972
  if (!('onhashchange' in window)) {
    oldHref = location.href;
    setInterval(function() {
      var newHref = location.href;
      if (oldHref !== newHref) {
        oldHref = newHref;
        decode_hash_string.call(window, {
          'type': 'hashchange',
          'newURL': newHref,
          'oldURL': oldHref
        });
      }
    }, 150);
  }
  else {
    listen(window, "hashchange", decode_hash_string);
  }
  
  // initial filtering
  decode_hash_string();
}

function update_location_hash() {
  var str = "";
  
  for (var key in filter_data) {
    if (key == "searchable") {
      if (filter_data.searchable.length > 0) {
        str += 'searchable="' + filter_data.searchable + '";';
      }
      continue;
    }
    
    if (filter_data[key].length == 0) {
      str += key + '=;'
    }
    else if (filter_data[key].length != all_filter_data[key].length) {
      str += key + '="' + filter_data[key].join('","') + '";'
    }
  }
  
  if (str == "" && "pushState" in history) {
    history.pushState("", document.title, location.pathname + location.search);
    // pushState does not trigger the hashchange event
    decode_hash_string();
  }
  else {
    location.hash = str;
  }
}

function decode_hash_string() {
  var hash = location.hash;
  
  filter_data = clone(all_filter_data);
  
  if (location.hash == "" || location.hash == "#") {
    // all ok, the full set is required
    console.info("hashchange", hash);
    console.log("no need to filter");
  }
  else {
    hash = hash.slice(1);
    
    console.info("hashchange", hash);
    while (hash != "") {
      var breakPos = hash.indexOf("=");
      var key = hash.slice(0, breakPos);
      hash = hash.slice(breakPos+1);
      
      if (hash[0] == ";") {
        filter_data[key] = [];
        hash = hash.slice(1);
      }
      else if (key == "searchable") {
        breakPos = hash.indexOf('";');
        var value = hash.slice(1, breakPos);
        hash = hash.slice(breakPos+2);
        filter_data[key] = value;
      }
      else {
        breakPos = hash.indexOf('";');
        var value = hash.slice(1, breakPos);
        hash = hash.slice(breakPos+2);
        filter_data[key] = value.split('","');
      }
    }
  }
  
  var $dropdownMenus = $filter.getElementsByTagName("ul");
  for (var i=0; i<$dropdownMenus.length; i++) {
    var key = $dropdownMenus[i].getAttribute("data-filter");
    var $checkedCnt = $dropdownMenus[i].previousSibling.getElementsByTagName("span")[0];
    var value = filter_data[key].length;
    $checkedCnt.innerHTML = value;
    $checkedCnt.className = "selected-" + value;
    
    var $currElem = $dropdownMenus[i].firstChild;
    while ($currElem = $currElem.nextSibling) {
      value = $currElem.getAttribute("data-value");
      $currElem.className = (filter_data[key].indexOf(value) == -1) ? "" : "checked";
    }
  }
  
  document.getElementById("filter_devices").value = filter_data.searchable
  
  refilter_devices();
}

function refilter_devices() {
  var hidden_cnt = 0;
  for (var i=0; i<$devices.length; i++) {
    $devices[i].removeAttribute("data-hidden");
    
    // first, check if device matches search query
    if ($devices[i].getAttribute("data-searchable").toLowerCase().indexOf(filter_data.searchable) == -1) {
      $devices[i].setAttribute("data-hidden", "true");
      hidden_cnt++;
      continue;
    }
    
    // then go through all filters and check if device matches here
    for (var key in filter_data) {
      if (key == "searchable") { // already handled outside the loop
        continue;
      }
      
      var value = $devices[i].getAttribute("data-" + key);
      
      if (key == "sfosversions") { // requires special handling because it's a list
        //var versions = value.split(/,?\s+/);
          var versions = value.split(",");
        
        var suitableVersion = false;
        for (var k=0; k<versions.length; k++) {
          if (filter_data[key].indexOf(versions[k]) > -1) {
            suitableVersion = true;
            break;
          }
        }
        if (!suitableVersion) {
          $devices[i].setAttribute("data-hidden", "true");
          hidden_cnt++;
          break;
        }
        
        continue;
      }
      
      if (filter_data[key].indexOf(value) == -1) {
        $devices[i].setAttribute("data-hidden", "true");
        hidden_cnt++;
        break;
      }
    }
  }
  
  if (hidden_cnt == $devices.length) {
    $emptyNote.removeAttribute("data-hidden");
  }
  else {
    $emptyNote.setAttribute("data-hidden", "true");
  }
}


contentLoaded(window, init_device_filter);
