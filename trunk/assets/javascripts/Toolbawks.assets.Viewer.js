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

Toolbawks.enableAssetsViewer = true;

Toolbawks.assets.Viewer = function() {
  var offset_from_mouse = [15, 15]; //image x,y offsets from cursor position in pixels. Enter 0,0 for no offset

  var current_image_height = 275;	// maximum image height.

  var current_image_width = 175;	// default image width.
  
  var asset_preview_overlay = false;
  
  return {
    attach_full_viewer : function(asset) {
      var asset = Ext.get(asset.id);
  
      asset.on('mouseover', function() { 
        window.status = ' ';
        return false;
      });
      asset.on('mouseout', function() { 
        window.status = ' '; 
        return false;
      });
    },

    attach_preview : function(asset) {
      var asset = Ext.get(asset.id);
  
      asset.on('mouseover', function(event) { 
        event.preventDefault();
    
        var url = $(asset.id).readAttribute('imgsrc_preview');
        var title = 'Photo Preview';
        var description = '';
        var width = parseInt($(asset.id).readAttribute('imgsrc_preview_width'));
        var height = parseInt($(asset.id).readAttribute('imgsrc_preview_height'));
    
        Toolbawks.assets.Viewer.asset_preview_overlay_show(url, title, description, width, height);
      });
  
      asset.on('mouseout', function(event) { 
        event.preventDefault();
    
        Toolbawks.assets.Viewer.asset_preview_overlay_hide();
      });
    },

    asset_popup : function(url, width, height) {
    	width = width + 10;
    	height = Math.min(screen.height - 65, height);
    	left = (screen.width / 2) - (width / 2); // center the window right to left
    	top = Math.max(0, (screen.height / 2) - (height / 2) - 35); // center the window top to bottom

    	// show scrollbar only if we have reached max screen size

    	if (top == 0) {
      	var scroll = "yes";
    	} else {
      	var scroll = "no";
    	}

    	window.open(url, "_blank", 'top=' + top + ',left=' + left + ',height=' + height + ',width=' + width + ',status=no, toolbar=no, menubar=no, location=no, resizable=no, scrollbars=' + scroll);
    },

    asset_preview_overlay_show : function(url, title, description, width, height) {
  
      Toolbawks.log('asset_preview_overlay_show -> width : ' + width + ', height : ' + height);
  
      Toolbawks.assets.Viewer.create_asset_preview_overlay();
  
    	if (height > 0) {
    		current_image_height = height;
    	}

    	if (width > 0) {
    		current_image_width = width;
    	}

    	Ext.get(document).on('mousemove', Toolbawks.assets.Viewer.asset_preview_overlay_follow);

    	var new_html = '<div class="content" style="width: ' + (current_image_width + 3) + 'px;">';

    	if (title != '') {
      	new_html = new_html + '<span class="title">' + title + '</span>';
    	}
	
    	if (description != '') {
      	new_html = new_html + '<span class="description">' + description + '</span>';
    	}

    	new_html = new_html + '<div class="image"><img src="' + url + '" class="" /></div>';
    	new_html = new_html + '</div>';

    	asset_preview_overlay.update(new_html);

    	asset_preview_overlay.show();
    },

    asset_preview_overlay_hide : function() {
      Toolbawks.log('asset_preview_overlay_hide');
  
    	Ext.get(document).removeListener('mousemove', Toolbawks.assets.Viewer.asset_preview_overlay_follow);

    	asset_preview_overlay.hide();

    	asset_preview_overlay.setStyle({ left : "-500px" });
    },

    create_asset_preview_overlay : function() {
      if (asset_preview_overlay) {
        return true;
      }
  
    	new Insertion.Bottom($$('body')[0], '<div id="asset_preview_overlay" class="asset_preview_overlay" style="display: none;">' + '</div>');
	
      asset_preview_overlay = $('asset_preview_overlay');
    },

    asset_preview_overlay_follow : function(e) {
      if (!asset_preview_overlay.visible()) {
//        return false;
      }
      
    	var offset = {
      	vertical : offset_from_mouse[0],
      	horizontal : offset_from_mouse[1]
    	};

    	var xcoord = 0;
    	var ycoord = 0;
    	
    	var margin = 10; // number of pixels from top, right, bottom, left
    	var below = false;
	
    	var page_size = Ext.get(document).getViewSize();
	
    	var overlay_size = asset_preview_overlay.descendants()[0].getDimensions();

      var container = {};

      container.width = overlay_size.width;
      container.height = overlay_size.height;
      container.width_center = Math.round(container.width / 2);

    	var current_mouse = {
      	horizontal : e.getPageX(),
      	vertical : e.getPageY()
    	};
	    
    	var max = {};
    	
    	max.center_left
    	
  	  max.pad_horizontal = offset.horizontal + margin;
  	  max.pad_vertical = offset.vertical + margin;
    	max.right = page_size.width - overlay_size.width - max.pad_horizontal;
      max.left = max.pad_horizontal;
      max.center_right = max.right + container.width_center + margin;
      max.center_left = max.left;
    	max.top = max.pad_vertical;
    	max.bottom = page_size.height - overlay_size.height - max.pad_vertical;

      Toolbawks.log('Toolbawks.assets.Viewer.asset_preview_overlay_follow -> max...');
      Toolbawks.dir(max);
      
    	var current_position = {};
    	
    	current_position.left = current_mouse.horizontal - overlay_size.width - offset.horizontal;
    	current_position.right = current_mouse.horizontal + offset.horizontal;
    	current_position.center_left = current_mouse.horizontal - container.width_center;
      current_position.center_right = current_mouse.horizontal + container.width_center;
    	current_position.top = current_mouse.vertical - overlay_size.height - offset.vertical;
    	current_position.bottom = current_mouse.vertical + offset.vertical;

      Toolbawks.log('Toolbawks.assets.Viewer.asset_preview_overlay_follow -> current_position...');
      Toolbawks.dir(current_position);

      if (max.left > max.right) {
        // the preview won't fit anywhere, don't show it
        xcoord -= 10000;
        ycoord -= 10000;

        Toolbawks.log('Toolbawks.assets.Viewer.asset_preview_overlay_follow -> hiding preview due to no left right or below options');
      } else if (current_position.right < max.right) {
    	  // position it to the right
        xcoord += current_position.right;
        
        Toolbawks.log('Toolbawks.assets.Viewer.asset_preview_overlay_follow -> position it to the right (current_position.right < max.right)');
    	} else if (current_position.left > max.left) {
    	  // position it to the left
    	  xcoord += current_position.left;
    	  
        Toolbawks.log('Toolbawks.assets.Viewer.asset_preview_overlay_follow -> position it to the left (current_position.left > max.left)');
      } else {
        // align center due to left and right not fitting naturally
        if (current_position.center_right < max.center_right && current_position.center_left > max.center_left) {
          // safe to place below due to right side
          xcoord += current_position.center_left;
          ycoord += offset.vertical;
          below = true;
          
          Toolbawks.log('Toolbawks.assets.Viewer.asset_preview_overlay_follow -> (current_position.center_right < max.center_right && current_position.center_left > margin)');
        } else {
          if (current_position.center_right > max.center_right) {
            // not safe due to the right side position, force center align anyways
            xcoord += max.center_left;
            ycoord += offset.vertical;
            below = true;
          
            Toolbawks.log('Toolbawks.assets.Viewer.asset_preview_overlay_follow -> (current_position.center_right > max.center_right)');
          } else if (current_position.center_left < max.center_left) {
            // not safe due to the right side position, force center align anyways
            xcoord += max.center_left;
            ycoord += offset.vertical;
            below = true;

            Toolbawks.log('Toolbawks.assets.Viewer.asset_preview_overlay_follow -> (current_position.center_right > max.center_right)');
          } else {
            // not safe due to left side position, align left plus margin
            xcoord += margin;
            ycoord += offset.vertical;
            below = true;
          
            Toolbawks.log('Toolbawks.assets.Viewer.asset_preview_overlay_follow -> (current_position.center_left < margin)');
          }
        }
      }
	    
      Toolbawks.log('Toolbawks.assets.Viewer.asset_preview_overlay_follow -> max.top : ' + max.top + ', max.bottom : ' + max.bottom + ', current_position.top : ' + current_position.top + ', current_position.bottom : ' + current_position.bottom);

      if (below) {
        // remove offset.vertical which was previously added (variables already include this value)
    	  ycoord -= offset.vertical;

        Toolbawks.log('Toolbawks.assets.Viewer.asset_preview_overlay_follow -> aligning below or above based on center align on X axis');
      }

    	if (current_position.bottom < max.bottom) {
    	  // safe to place below
        ycoord += current_position.bottom;

        Toolbawks.log('Toolbawks.assets.Viewer.asset_preview_overlay_follow -> (current_position.bottom < max.bottom)');
      } else if (current_position.top > max.top) {
    	  // safe to place above
        ycoord += current_position.top;

        Toolbawks.log('Toolbawks.assets.Viewer.asset_preview_overlay_follow -> (current_position.top > max.top)');
    	} else {
    	  // not safe top or bottom, force bottom
        ycoord += current_position.bottom;

        Toolbawks.log('Toolbawks.assets.Viewer.asset_preview_overlay_follow -> forcing bottom align');
      }

    	asset_preview_overlay.setStyle({ 
    	  left : xcoord + "px",
    	  top : ycoord + "px"
    	});
    },

    true_body : function() {
      return (!window.opera && document.compatMode && document.compatMode != "BackCompat") ? document.documentElement : document.body;
    }
  };
}();