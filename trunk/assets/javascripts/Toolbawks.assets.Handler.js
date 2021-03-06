/*
# Copyright (c) 2007 Nathaniel Brown
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
*/

Toolbawks.assets.Handler = function() {
  var base_url = '/toolbawks/assets/';
  
  return {
    base_url : function() {
      return base_url;
    },
    
    update : function(id, name, parent_id) {
      var id = (id && id.indexOf('tag-') != -1) ? id.replace('tag-', '') : id;
      var parent_id = (parent_id && parent_id.indexOf('tag-') != -1) ? parent_id.replace('tag-', '') : parent_id;
      var url = Toolbawks.assets.Handler.base_url() + 'update/' + id;
      var params = false;
      
      var p = [];
      if (name) p[p.length] = 'tag[name]=' + name;
      if (parent_id) p[p.length] = 'tag[parent_id]=' + parent_id;
      params = p.join('&');
      
      var timeout = 5;
      var callback = function() {};
      var method = 'GET';

      method = method || (params ? "POST" : "GET");

      var responseSuccess = function(o) {
        Toolbawks.dialog.msg('Tag Manager', o.responseText);
      };

      var responseFailure = function(o) {
        Toolbawks.dialog.msg('Tag Manager', 'Error creating new tag');
      };

      var cb = {
          success: responseSuccess,
          failure: responseFailure,
          timeout: (timeout*1000),
          argument: {"url": url, "form": null, "callback": callback, "params": params}
      };

      var req = Ext.lib.Ajax.request(method, url, cb, params); 
    },

    create : function() {
      var url = Toolbawks.assets.Handler.base_url() + 'create';
      var params = false;
      var tag_details = false;
      
      var callback = function() {};
      var method = 'GET';

      method = method || (params ? "POST" : "GET");

      var responseSuccess = function(o) {
        tag_details = Ext.util.JSON.decode(o.responseText);
      };

      var responseFailure = function(o) {
        Toolbawks.dialog.msg('Tag Manager', 'Error creating new tag');
      };

      var options = {
          onSuccess: responseSuccess,
          onFailure: responseFailure,
          asynchronous: false,
          parameters: params
      };
      
      // Prototype specific call
      var req = new Ajax.Request(url, options); 
      
      return tag_details;
    },
    
    destroy : function(id) {
      var url = Toolbawks.assets.Handler.base_url() + 'remove/' + id;
      var params = false;
      var timeout = 5;
      var callback = function() {};
      var method = 'GET';

      method = method || (params ? "POST" : "GET");

      var responseSuccess = function(o) {
        Toolbawks.dialog.msg('Tag Manager', o.responseText);
      };

      var responseFailure = function(o) {
        Toolbawks.dialog.msg('Tag Manager', 'Error removing asset');
      };

      var cb = {
          success: responseSuccess,
          failure: responseFailure,
          timeout: (timeout*1000),
          argument: {"url": url, "form": null, "callback": callback, "params": params}
      };

      var req = Ext.lib.Ajax.request(method, url, cb, params);
    }
  };
}();