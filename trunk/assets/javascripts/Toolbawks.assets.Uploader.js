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

Toolbawks.assets.Uploader = function() {
  var _uploader_count = 0;
  var _uploader_stack = [];
  var _ = {
    hooks : {
      create : []
    }
  };
  
  return {
    verify_hook_scope : function(scope) {
      switch (scope) {
        case 'create':
          return true;
        default:
          return false;
      }
    },
    
    add_hook : function(scope, func) {
      if (!Toolbawks.assets.Uploader.verify_hook_scope(scope)) {
        Toolbawks.error('Toolbawks.assets.Uploader.add_hook : Hook failed to be added to scope [' + scope + ']. Hook details : ' + func);
        return false;
      } else {
        Toolbawks.log('Toolbawks.assets.Uploader.add_hook : Added hook to scope [' + scope + ']. Hook details : ' + func);
      }
      _.hooks[scope][_.hooks[scope].length] = func;
    },
    
    get_hooks : function(scope) {
      if (!Toolbawks.assets.Uploader.verify_hook_scope(scope)) {
        Toolbawks.error('Toolbawks.assets.Uploader.get_hooks : Invalid scope while fetching hooks');
        return false;
      }
      return _.hooks[scope];
    },

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
		  Toolbawks.info('Toolbawks.assets.Uploader.get_container_options');

      container = $(container);
      
      if (!container) {
        return false;
      }
      
      var embedded = false;
      
      if (container.hasClassName('toolbawks_assets_manager')) {
        // this is an embedded conatainer for uploaders
        embedded = true;

        // create a new id entirely
        var uploader_container_id = 'toolbawks_assets_manager_upload_container_' + Toolbawks.assets.Uploader.get_uploader_count();
      } else {
        if (container.id != '' && container.id != undefined) {
          // use the conatiners id already if its not embedded
          var uploader_container_id = container.id;
        } else {
          // assign the container an id and use that
          var uploader_container_id = container.id = 'toolbawks_assets_manager_upload_container_' + Toolbawks.assets.Uploader.get_uploader_count();
        }
      }
      
      var options = $H({ 
        name : ((container.readAttribute('name') == 'true') ? true : false),
        description : ((container.readAttribute('description') == 'true') ? true : false), 
        association_klass : container.readAttribute('association_klass'), 
        association_id : container.readAttribute('association_id'),
        uploader_container_id : uploader_container_id,
        embedded : embedded,
        file_input_size : (container.readAttribute('file_input_size') ? container.readAttribute('file_input_size') : 30),
        name_label : (container.readAttribute('name_label') ? container.readAttribute('name_label') : false),
        attached_to_viewer: (embedded == true) ? true : (container.readAttribute('attached_to_viewer') == 'true' ? true : false)
      });
      
      return options;
    },
    
    get_attributes_from_viewer_to_string : function(viewer) {
      viewer = $(viewer);

      var attributes = [];
      
      Toolbawks.assets.Uploader.get_container_options(viewer).each(function(pair) {
        pair.value = ((pair.value === true || pair.value === false) ? (pair.value ? 'true' : 'false') : pair.value);
        attributes.push(pair.key + '="' + pair.value + '"');
      });
      
      return attributes.join(' ');
    },
    
    build_container : function(viewer, embedded) {
      var options = Toolbawks.assets.Uploader.get_container_options(viewer);

      // create container and title
      var html = '<ul class="toolbawks_assets_manager_uploader" id="' + options.uploader_container_id + '" ' + Toolbawks.assets.Uploader.get_attributes_from_viewer_to_string(viewer) + '><li class="title"><h2>Upload Asset</h2></li></ul>';

      // if this is embedded in the asset manager, use the parent node
      if (embedded == true) {
        Ext.DomHelper.insertAfter(viewer.parentNode, html);
      } else {
        Ext.DomHelper.append(viewer, html);
      }
      
      for (var x = 0; x < 3; x++) {
        Toolbawks.assets.Uploader.add_uploader(options);
      }
    },
    
    add_uploader: function(options) {
      var uploader_details = Toolbawks.assets.Uploader.build_uploader(options);

      Ext.DomHelper.append($(options.uploader_container_id), uploader_details.html, true);
      
      // Called on change of the file field
      Ext.EventManager.on(uploader_details.file_id, 'change', Toolbawks.assets.Uploader.submit_uploader);      
    },
    
    build_uploader : function(options) {
      var uploader_count = ++_uploader_count;
      
      var form_id = 'toolbawks_assets_manager_uploader_' + uploader_count;
      var file_id = 'toolbawks_assets_manager_uploader_asset_details_uploaded_data_' + uploader_count;
      var iframe_id = 'toolbawks_assets_manager_uploader_iframe_' + uploader_count;
      
      // check container properties for model and model_id
      var field_name = (options.name == true) ? (options.name_label ? '<label class="name" for="toolbawks_assets_manager_uploader_asset_name_' + uploader_count + '">Name</label>' : '') + '<input class="name" id="toolbawks_assets_manager_uploader_asset_name_' + uploader_count + '" name="asset[name]" type="text" />' : '<input name="asset[name]" type="hidden" />';
      var field_description = (options.description == true) ? '<label class="name" for="toolbawks_assets_manager_uploader_asset_description_' + uploader_count + '">Description</label><textarea class="description" id="toolbawks_assets_manager_uploader_asset_description_' + uploader_count + '" name="asset[description]"></textarea>' : '<input name="asset[description]" type="hidden" />';
      
      var html = new Array('',
        '<li class="asset_uploader">',
        '<form id="' + form_id + '" rel="' + uploader_count + '" container="' + options.uploader_container_id + '" action="/toolbawks/assets/create?uploader_count=' + uploader_count + '&_cache_id=' + Math.floor(Math.random() * 99999) + '" enctype="multipart/form-data" method="post" target="' + iframe_id + '">',
        field_name,
        field_description,
        '<label for="' + file_id +'" class="file"></label><input id="' + file_id + '" rel="' + uploader_count + '" name="asset_detail[uploaded_data]" size="' + (options.file_input_size ? options.file_input_size : '30') + '" type="file" class="file" />',
        '<input name="association[klass]" type="hidden" value="' + options.association_klass + '" />',
        '<input name="association[id]" type="hidden" value="' + options.association_id + '" />',
        '<iframe id="' + iframe_id + '" rel="' + uploader_count + '" name="' + iframe_id + '" src="about:blank;" class="toolbawks_assets_manager_uploader_iframe" onload="Toolbawks.assets.Uploader.iframe_loaded(\'' + iframe_id + '\')"></iframe>',
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
    	  Toolbawks.dialog.msg('Asset Uploader', 'Invalid file, please try again');
    		return;
    	}

    	// get number
    	var uploader_count = $(file_field).readAttribute('rel');
    	if (parseInt(uploader_count) == 0) {
    		return;
    	}
    	
    	//check that the file hasn't already been uploaded in this instance
    	/*
    	Toolbawks.assets.Uploader.get_stack().each(function(uploader_file_id) {
    	  if (file_id.getValue() == Ext.get(uploader_file_id).getValue()) {
    	    Toolbawks.dialog.msg('Asset Uploader', 'Unable to upload a duplicate file.');
    	    return $break;
  	    }
  	  });
  	  */
  	  
      // Add the file id into the stack
      Toolbawks.assets.Uploader.add_to_stack(filename);

		  Toolbawks.info('Toolbawks.assets.Uploader.get_stack().length : ' + Toolbawks.assets.Uploader.get_stack().length + ', Toolbawks.assets.Uploader.get_uploader_count() : ' + Toolbawks.assets.Uploader.get_uploader_count());
		  
      if ( Toolbawks.assets.Uploader.get_stack().length >= Toolbawks.assets.Uploader.get_uploader_count() ) {
			  // Add an AJAX uploader
			  Toolbawks.log('Adding new uploader to container : ' + frm.readAttribute('container'));

			  var container = $(frm.readAttribute('container'));
        var container_options = Toolbawks.assets.Uploader.get_container_options(container);
        
        Toolbawks.assets.Uploader.add_uploader(container_options);
      } else {
			  Toolbawks.log('There is already enough free uploaders, not adding another');
      }


    	//submit form via AFB class
    	Toolbawks.assets.Uploader.submit_uploader_handler(frm, uploader_count, filename);
    },
    
    submit_uploader_handler : function(frm, uploader_count, filename) {
      Toolbawks.info('submit_uploader_handler : uploader_count: ' + uploader_count + ', filename: ' + filename + '');
      
      // Return if unable to find the uploader_count var to assign the number to this handler
    	if (!uploader_count) { 
    	  return;
    	}
      
  		Toolbawks.info('Toolbawks.assets.Uploader.submit_uploader_handler -> submit form');
  		
      frm.submit();

  	  // options for the submit uploader
  	  var options = {
  	    onComplete : function(o, uploader_count) {
  	      Toolbawks.info('iframe executed -> options.onComplete');
          Toolbawks.assets.Uploader.submit_uploader_return(o, uploader_count);
  	    },

  	    onStart : function(frm, uploader_count) {
  	      Toolbawks.info('iframe executed -> options.onStart');

        	// show uploading state
        	var notifier = [
        	  '<p id="toolbawks_assets_manager_uploader_notify_' + uploader_count + '" class="notify uploading">',
        	  'Uploading...',
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

      Toolbawks.info('Toolbawks.assets.Uploader.submit_uploader_handler -> submit callback -> options defined');

  	  return Toolbawks.assets.Uploader.submit_uploader_init(frm, uploader_count, options);
    },

    submit_uploader_init : function(frm, uploader_count, options) {
      Toolbawks.info('Toolbawks.assets.Uploader.submit_uploader_init');
      
  	  // set the target of the form to the id of the return iframe builder 
  		if (options && typeof(options.onStart) == 'function') {
  			options.onStart(frm, uploader_count);
  		}
  		
	    // Attach the onComplete event to the iframe here
  	  if (options && typeof(options.onComplete) == 'function') {
        Toolbawks.info('Toolbawks.assets.Uploader.submit_uploader_init -> attached onComplete event');
  			$('toolbawks_assets_manager_uploader_iframe_' + uploader_count).onComplete = options.onComplete;
  		}
    },
    
    submit_uploader_return : function(r, uploader_count) {
      Toolbawks.info('Toolbawks.assets.Uploader.submit_uploader_return');
      var response = Ext.decode(r.responseText);
      
      var toolbawks_assets_manager_uploader = $('toolbawks_assets_manager_uploader_' + response.uploader_count);
      
      var data = {
        id : response.asset.id,
		    name : response.asset.name,
		    description : response.asset.description,
		    small : response.asset.small,
		    thumbnail : response.asset.thumbnail,
		    modified_at : response.asset.modified_at,
		    created_at : response.asset.created_at,
		    association : {
		      class : response.association.klass,
		      id : response.association.id
		    }
      };
      
      if (toolbawks_assets_manager_uploader) {
        var container = $(toolbawks_assets_manager_uploader.readAttribute('container'));

        // is this uploader attached to the viewer interface
        if (container) {
          var container_options = Toolbawks.assets.Uploader.get_container_options(container);
        
          if (container_options.attached_to_viewer == true) {
            // call the interface and add a row for this image
            Toolbawks.info('submit_uploader_return -> attached_to_viewer -> Toolbawks.assets.Interface.add');
        
            Toolbawks.assets.Interface.add(data);
          }
        }
      }
      
      // Run the hooks for creating a new asset
      Toolbawks.assets.Uploader.get_hooks('create').each(function(hook) {
        Toolbawks.log('Toolbawks.assets.Uploader.create -> running hook...');
        hook(data);
      });

    	// display a different message.
    	var p = Ext.get('toolbawks_assets_manager_uploader_notify_' + uploader_count);
    	
    	if (p) {
    		p.replaceClass('uploading', 'done');
    		p.update('File uploaded: <span class="asset_name">' + response.asset.name + '</span>' + ((response.asset.name != response.asset.filename) ? ' (<span class="asset_filename">' + response.asset.filename + '</span>)' : ''));
    	}

      Toolbawks.info('Asset Uploader', 'File has been successfully uploaded');
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
      
      Toolbawks.info(iframe_document.location.href);
      
  		if (iframe_document.location.href.indexOf("blank") != -1) {
  		  Toolbawks.info('iframe location contains "blank"');
  			return;
  		}

  		if (typeof(iframe.onComplete) == 'function') {
  		  Toolbawks.info('Executing onComplete');
  		  
  		  var response = {
  		    responseText : iframe_document.body.innerHTML
		    };
		    
  			iframe.onComplete(response, uploader_count);
  		}
  	}
  };
}();