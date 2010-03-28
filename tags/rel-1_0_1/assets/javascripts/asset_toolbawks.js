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

//  Portion of this library is based on the AJAX iFrame Method (AIM)  [http://www.webtoolkit.info/]

var AssetManagerInterface = function(){
  // shorthand
  var Tree = Ext.tree;
  var ds = false;
  var paging = false;

  // definition for new rows
  var AssetRecord = Ext.data.Record.create(
    {name: 'id'},
    {name: 'name'},
    {name: 'description'},
    {name: 'thumbnail'},
    {name: 'modified_at', type: 'date', dateFormat: 'F d, Y'},
    {name: 'created_at', type: 'date', dateFormat: 'F d, Y'}
  );
  
  return {
		init : function(){
		  Ext.QuickTips.init();
		  
			$$('.toolbawks_asset_manager').each(function(container){
				AssetManagerInterface.build(container);
				
				// Check if container has attribute uploader="true"
  		  var uploader = container.readAttribute('uploader') == 'true' ? true : false;
  		  
				if (uploader == true) {
				  // Show the AJAX uploader
				  AssetManagerUploader.build_container(container, true);
				}
			});
		},

		build: function(container) {
		  var id = container.id;
		  var filter = container.readAttribute('filter') == 'true' ? true : false;
		  
		  if (filter == true || 
		   (container.readAttribute('association_klass') 
		    && container.readAttribute('association_klass') != ''
		    && container.readAttribute('association_id') 
		    && container.readAttribute('association_id') != '')
		  ){
		    filter = true;
  		  var association_klass = container.readAttribute('association_klass');
  		  var association_id = container.readAttribute('association_id');
		  }
		  
      // create the Data Store
      ds = new Ext.data.Store({
          // load using script tags for cross domain, if the data in on the same domain as
          // this page, an HttpProxy would be better
          proxy: new Ext.data.HttpProxy({
              url: AssetManager.base_url() + 'show'
          }),

          // create reader that reads the Topic records
          reader: new Ext.data.JsonReader({
              root: 'assets',
              totalProperty: 'totalCount',
              id: 'id',
          }, [
            {name: 'id'},
            {name: 'name'},
            {name: 'description'},
            {name: 'thumbnail'},
            {name: 'modified_at', type: 'date'},
            {name: 'created_at', type: 'date'}
          ]),

          // turn on remote sorting
          remoteSort: true
      });
      ds.setDefaultSort('name', 'desc');

      // pluggable renders
      function renderAsset(value, p, record){
        return String.format('<b>{0}</b> {1}', value, record.data['description']);
      }
      function renderAssetPlain(value){
        return String.format('<b><i>{0}</i></b>', value);
      }
      function renderDate(value){
        var monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ];
        return String.format('{0} {1}, {2}', monthNames[value.getMonth()], value.getDate(), value.getFullYear());
      }
      function renderThumbnail(value){
        if (value && value != '') {
          return String.format('<img src="{0}" />', value);
        }
      }

      // the column model has information about grid columns
      // dataIndex maps the column to the specific data field in
      // the data store
      var cm = new Ext.grid.ColumnModel([
        {
           id: 'thumbnail', // id assigned so we can apply custom css (e.g. .x-grid-col-topic b { color:#333 })
           header: "Thumbnail",
           dataIndex: 'thumbnail',
           width: 80,
           renderer: renderThumbnail,
           sortable: false,
           resizable: false,
           align: 'middle'
        },{
           id: 'asset', // id assigned so we can apply custom css (e.g. .x-grid-col-topic b { color:#333 })
           header: "Asset",
           dataIndex: 'name',
           renderer: renderAsset,
           css: 'white-space:normal;'
        },{
           id: 'date',
           header: "Date",
           dataIndex: 'created_at',
           renderer: renderDate,
           width: 150,
           align: 'right'
        }
      ]);

      // by default columns are sortable
      cm.defaultSortable = true;
      
      // Dynamically reset the width of the Assets column
      var newAssetColumnWidth = Ext.get(id).getWidth() - (cm.getTotalWidth(false) - cm.defaultWidth);
      cm.setColumnWidth(1, newAssetColumnWidth);
      
      // create the editor grid
      var grid = new Ext.grid.Grid(id, {
          ds: ds,
          cm: cm,
          selModel: new Ext.grid.RowSelectionModel({singleSelect:true}),
          enableColLock:false,
          loadMask: true
      });

      // make the grid resizable, do before render for better performance
      var rz = new Ext.Resizable(id, {
          wrap:true,
          minHeight:200,
          pinned:true,
          handles: 's'
      });
      
      rz.on('resize', grid.autoSize, grid);

      // render it
      grid.render();

      var gridFoot = grid.getView().getFooterPanel(true);
      
      // add a paging toolbar to the grid's footer
      paging = new Ext.PagingToolbar(gridFoot, ds, {
          pageSize: 25,
          displayInfo: true,
          displayMsg: 'Displaying assets {0} - {1} of {2}',
          emptyMsg: "No assets to display"
      });
      // add the detailed view button

      // No need for a detailed button at this point
      var remove_button = new Ext.Toolbar.Button({
          text: 'Remove Asset',
          cls: 'x-btn-text-icon remove'
      });
      
      remove_button.on('click', removeAsset);

      paging.add('-', remove_button);
      
      // trigger the data store load
      if (filter == true) {
        var parameters = {
          start:0, 
          limit:25,
          "association[klass]": association_klass, 
          "association[id]": association_id,
          "filter": filter
        }
      } else {
        var parameters = {
          start:0, 
          limit:25
        }
      }

      ds.load({params: parameters});
      
      function removeAsset(btn, pressed){
        var asset_row = grid.getSelectionModel().getSelected();
        
        if (!asset_row || !asset_row.id || asset_row.id == '') {
          Ext.info.msg('Remove Asset', 'No asset selected to be removed');
          return false;
        }
        
        AssetManager.destroy(asset_row.id);
        ds.remove(asset_row);
        --ds.totalLength;
        paging.updateInfo();
        grid.getView().refresh();
      }

		},
		
		add : function(data) {
		  console.dir(data);
		  
		  var row = new AssetRecord({
  	      id : data.id,
  		    name : data.name,
  		    description : data.description,
  		    thumbnail : data.thumbnail,
  		    modified_at : new Date(data.modified_at),
  		    created_at : new Date(data.created_at)
	      },
	      data.id
	    );

      ds.add(row);
      ++ds.totalLength;
      
		  paging.updateInfo();
	  }
	};
}();

var AssetManager = function() {
  var base_url = '/toolbawks/assets/';
  
  return {
    base_url : function() {
      return base_url;
    },
    
    textchange: function(node, text, oldText) {
      TagManager.update(node.id, text, false, false);
    },

    update : function(id, name, parent_id) {
      var id = (id && id.indexOf('tag-') != -1) ? id.replace('tag-', '') : id;
      var parent_id = (parent_id && parent_id.indexOf('tag-') != -1) ? parent_id.replace('tag-', '') : parent_id;
      var url = AssetManager.base_url() + 'update/' + id;
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
        Ext.info.msg('Tag Manager', o.responseText);
      };

      var responseFailure = function(o) {
        Ext.info.msg('Tag Manager', 'Error creating new tag');
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
      var url = AssetManager.base_url() + 'create';
      var params = false;
      var tag_details = false;
      
      var callback = function() {};
      var method = 'GET';

      method = method || (params ? "POST" : "GET");

      var responseSuccess = function(o) {
        tag_details = Ext.util.JSON.decode(o.responseText);
      };

      var responseFailure = function(o) {
        Ext.info.msg('Tag Manager', 'Error creating new tag');
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
      var url = AssetManager.base_url() + 'remove/' + id;
      var params = false;
      var timeout = 5;
      var callback = function() {};
      var method = 'GET';

      method = method || (params ? "POST" : "GET");

      var responseSuccess = function(o) {
        Ext.info.msg('Tag Manager', o.responseText);
      };

      var responseFailure = function(o) {
        Ext.info.msg('Tag Manager', 'Error removing asset');
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

var AssetManagerUploader = function() {
  var _uploader_count = 0;
  var _uploader_stack = [];
  
  return {
    add_to_stack : function(el_id) {
      _uploader_stack.push(el_id);
      return _uploader_stack;
    },
    
    get_stack: function(pos) {
      return (!pos || pos == undefined) ? _uploader_stack : _uploader_stack[pos];
    },
    
    get_uploader_count : function() {
      return _uploader_count;
    }, 
    
    get_container_options : function(container) {
      container = $(container);
      
      var embedded = false;
      
      if (container.hasClassName('toolbawks_asset_manager')) {
        // this is an embedded conatainer for uploaders
        embedded = true;

        // create a new id entirely
        var uploader_container_id = 'toolbawks_asset_manager_upload_container_' + AssetManagerUploader.get_uploader_count()
      } else {
        if (container.id != '' && container.id != undefined) {
          // use the conatiners id already if its not embedded
          var uploader_container_id = container.id;
        } else {
          // assign the container an id and use that
          var uploader_container_id = container.id = 'toolbawks_asset_manager_upload_container_' + AssetManagerUploader.get_uploader_count();
        }
      }
      
      var options = $H({ 
        name : ((container.readAttribute('name') == 'true') ? true : false),
        description : ((container.readAttribute('description') == 'true') ? true : false), 
        association_klass : container.readAttribute('association_klass'), 
        association_id : container.readAttribute('association_id'),
        uploader_container_id : uploader_container_id,
        embedded : embedded,
        attached_to_viewer: (embedded == true) ? true : (container.readAttribute('attached_to_viewer') == 'true' ? true : false)
      });
      
      return options;
    },
    
    get_attributes_from_viewer_to_string : function(viewer) {
      viewer = $(viewer);

      var attributes = [];
      
      AssetManagerUploader.get_container_options(viewer).each(function(pair) {
        pair.value = ((pair.value === true || pair.value === false) ? (pair.value ? 'true' : 'false') : pair.value);
        attributes.push(pair.key + '="' + pair.value + '"');
      });
      
      return attributes.join(' ');
    },
    
    build_container : function(viewer, embedded) {
      var options = AssetManagerUploader.get_container_options(viewer);

      // create container and title
      var html = '<ul class="toolbawks_asset_manager_uploader" id="' + options.uploader_container_id + '" ' + AssetManagerUploader.get_attributes_from_viewer_to_string(viewer) + '><li class="title"><h2>Upload Asset</h2></li></ul>';

      // if this is embedded in the asset manager, use the parent node
      if (embedded == true) {
        Ext.DomHelper.insertAfter(viewer.parentNode, html);
      } else {
        Ext.DomHelper.append(viewer, title_html);
      }
      
      for (var x = 0; x < 3; x++) {
        AssetManagerUploader.add_uploader(options);
      }
    },
    
    add_uploader: function(options) {
      var uploader_details = AssetManagerUploader.build_uploader(options);

      Ext.DomHelper.append($(options.uploader_container_id), uploader_details.html, true);
      
      // Called on change of the file field
      Ext.EventManager.on(uploader_details.file_id, 'change', AssetManagerUploader.submit_uploader);      
    },
    
    build_uploader : function(options) {
      var uploader_count = ++_uploader_count;
      
      var form_id = 'asset_manager_uploader_' + uploader_count;
      var file_id = 'asset_manager_uploader_asset_details_uploaded_data_' + uploader_count;
      var iframe_id = 'asset_manager_uploader_iframe_' + uploader_count;
      
      // check container properties for model and model_id
      var field_name = (options.name == true) ? '<label class="name" for="asset_manager_uploader_asset_name_' + uploader_count + '">Name</label><input class="name" id="asset_manager_uploader_asset_name_' + uploader_count + '" name="asset[name]" type="text" />' : '<input name="asset[name]" type="hidden" />';
      var field_description = (options.description == true) ? '<label class="name" for="asset_manager_uploader_asset_description_' + uploader_count + '">Description</label><textarea class="description" id="asset_manager_uploader_asset_description_' + uploader_count + '" name="asset[description]"></textarea>' : '<input name="asset[description]" type="hidden" />';
      
      var html = new Array('',
        '<li>',
        '<form id="' + form_id + '" rel="' + uploader_count + '" container="' + options.uploader_container_id + '" action="/toolbawks/assets/create?uploader_count=' + uploader_count + '&_cache_id=' + Math.floor(Math.random() * 99999) + '" enctype="multipart/form-data" method="post" target="' + iframe_id + '">',
        field_name,
        field_description,
        '<label for="' + file_id +'" class="file"></label><input id="' + file_id + '" rel="' + uploader_count + '" name="asset_detail[uploaded_data]" size="30" type="file" class="file" />',
        '<input name="association[klass]" type="hidden" value="' + options.association_klass + '" />',
        '<input name="association[id]" type="hidden" value="' + options.association_id + '" />',
        '<iframe id="' + iframe_id + '" rel="' + uploader_count + '" name="' + iframe_id + '" src="about:blank;" class="toolbawks_asset_manager_uploader_iframe" onload="AssetManagerUploader.iframe_loaded(\'' + iframe_id + '\')"></iframe>',
        '</form>',
        '</li>'
      ).join("\n");
      
      return { 
        html: html, 
        id: form_id, 
        file_id: file_id 
      };
    },

    submit_uploader : function(e, file_field) {
    	var frm = $(file_field.form.id);
    	var filename = new String(file_field.value);

    	// check value length
    	if (filename == '') {
    		return;
    	}
    	
    	// ensure that it is a path for the value
    	if (!(filename.indexOf('/') != -1 || filename.indexOf('\\') != -1)) {
    	  Ext.info.msg('Asset Uploader', 'Invalid file, please try again');
    		return;
    	}

    	// get number
    	var uploader_count = $(file_field).readAttribute('rel');
    	if (parseInt(uploader_count) == 0) {
    		return;
    	}
    	
    	//check that the file hasn't already been uploaded in this instance
    	/*
    	AssetManagerUploader.get_stack().each(function(uploader_file_id) {
    	  if (file_id.getValue() == Ext.get(uploader_file_id).getValue()) {
    	    Ext.info.msg('Asset Uploader', 'Unable to upload a duplicate file.');
    	    return $break;
  	    }
  	  });
  	  */
  	  
      // Add the file id into the stack
      AssetManagerUploader.add_to_stack(filename);

		  console.info('AssetManagerUploader.get_stack().length : ' + AssetManagerUploader.get_stack().length + ', AssetManagerUploader.get_uploader_count() : ' + AssetManagerUploader.get_uploader_count());
		  
      if ( AssetManagerUploader.get_stack().length >= AssetManagerUploader.get_uploader_count() ) {
			  // Add an AJAX uploader
			  console.log('Adding new uploader to container : ' + frm.readAttribute('container'));

			  var container = $(frm.readAttribute('container'));
        var container_options = AssetManagerUploader.get_container_options(container);
        
        AssetManagerUploader.add_uploader(container_options);
      } else {
			  console.log('There is already enough free uploaders, not adding another');
      }


    	//submit form via AFB class
    	AssetManagerUploader.submit_uploader_handler(frm, uploader_count, filename);
    },
    
    submit_uploader_handler : function(frm, uploader_count, filename) {
      console.info('submit_uploader_handler : uploader_count: ' + uploader_count + ', filename: ' + filename + '');
      
      // Return if unable to find the uploader_count var to assign the number to this handler
    	if (!uploader_count) { 
    	  return;
    	}
      
  		console.info('AssetManagerUploader.submit_uploader_handler -> submit form');
  		
      frm.submit();

  	  // options for the submit uploader
  	  var options = {
  	    onComplete : function(o, uploader_count) {
  	      console.info('iframe executed -> options.onComplete');
          AssetManagerUploader.submit_uploader_return(o, uploader_count);
  	    },

  	    onStart : function(frm, uploader_count) {
  	      console.info('iframe executed -> options.onStart');

        	// show uploading state
        	var notifier = [
        	  '<p id="asset_manager_uploader_notify_' + uploader_count + '" class="notify uploading">',
        	  'Uploading... Feel free to add more files',
        	  '</p>'
        	].join('');

        	Ext.DomHelper.append(frm, notifier);

        	// disable all inputs in the form
        	frm.getInputs().each(function(input) {
          	input.blur();
          	input.addClassName('disabled');
          	input.disabled = 'true';
      	  });
  	    }
      };

      console.info('AssetManagerUploader.submit_uploader_handler -> submit callback -> options defined');

  	  return AssetManagerUploader.submit_uploader_init(frm, uploader_count, options);
    },

    submit_uploader_init : function(frm, uploader_count, options) {
      console.info('AssetManagerUploader.submit_uploader_init');
      
  	  // set the target of the form to the id of the return iframe builder 
  		if (options && typeof(options.onStart) == 'function') {
  			options.onStart(frm, uploader_count);
  		}
  		
	    // Attach the onComplete event to the iframe here
  	  if (options && typeof(options.onComplete) == 'function') {
        console.info('AssetManagerUploader.submit_uploader_init -> attached onComplete event');
  			$('asset_manager_uploader_iframe_' + uploader_count).onComplete = options.onComplete;
  		}
    },
    
    submit_uploader_return : function(r, uploader_count) {
      var response = Ext.decode(r.responseText);
      
      var container = $($('asset_manager_uploader_' + response.uploader_count).readAttribute('container'));
      var container_options = AssetManagerUploader.get_container_options(container);
      
      // is this uploader attached to the viewer interface
      if (container_options.attached_to_viewer == true) {
        // call the interface and add a row for this image
        var data = {
          id : response.asset.id,
  		    name : response.asset.name,
  		    description : response.asset.description,
  		    thumbnail : response.asset.thumbnail,
  		    modified_at : response.asset.modified_at,
  		    created_at : response.asset.created_at
        };
        AssetManagerInterface.add(data);
      }
      
    	// display a different message.
    	var p = Ext.get('asset_manager_uploader_notify_' + uploader_count);
    	
    	if (p) {
    		p.replaceClass('uploading', 'done');
    		p.update('File has been uploaded: <span class="asset_name">' + response.asset.name + '</span>' + ((response.asset.name != response.asset.filename) ? ' (<span class="asset_filename">' + response.asset.filename + '</span>)' : ''));
    	}

      Ext.info.msg('Asset Uploader', 'File has been successfully uploaded');
    },

    get_file_name : function(str) {
    	var len = str.length;
    	var rs = 0;
    	
    	for (var i = len; i > 0; i--) {
    		vb = str.substring(i, i + 1);
    		
    		if ((vb == "\\" || vb == "/") && rs == 0) {
    			return str.substring(i + 1, len);
    		}
    	}
    },
    
  	iframe_loaded : function(id) {
  		var iframe = $(id);
  		var uploader_count = iframe.readAttribute('rel');
  		
      // get the iframe's document based on a variety of browsers
  		if (iframe.contentDocument) {
  			var iframe_document = iframe.contentDocument;
  		} else if (iframe.contentWindow) {
  			var iframe_document = iframe.contentWindow.document;
  		} else {
  			var iframe_document = window.frames[id].document;
  		}
      
      console.info(iframe_document.location.href);
      
  		if (iframe_document.location.href.indexOf("blank") != -1) {
  		  console.info('iframe location contains "blank"');
  			return;
  		}

  		if (typeof(iframe.onComplete) == 'function') {
  		  console.info('Executing onComplete');
  		  
  		  var response = {
  		    responseText : iframe_document.body.innerHTML
		    };
		    
  			iframe.onComplete(response, uploader_count);
  		}
  	}
  };
}();

Ext.onReady(AssetManagerInterface.init, AssetManagerInterface, true);