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

Toolbawks.enableAssetsInterface = true;

Toolbawks.assets.Interface = function() {
  // shorthand
  var Tree = Ext.tree;
  
  var ds = false;
  var paging = false;
  var grid = false;
  var filter = false;
  
  var hooks = {
    init : [],
    create : [],
    destroy : []
  };

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
    verify_hook_scope : function(scope) {
      switch (scope) {
        case 'init':
        case 'create':
        case 'destroy':
          return true;
        default:
          return false;
      }
    },
    
    add_hook : function(scope, func) {
      if (!Toolbawks.assets.Interface.verify_hook_scope(scope)) {
        Toolbawks.error('Toolbawks.assets.Interface.add_hook : Hook failed to be added to scope [' + scope + ']. Hook details : ' + func);
        return false;
      } else {
        Toolbawks.log('Toolbawks.assets.Interface.add_hook : Added hook to scope [' + scope + ']. Hook details : ' + func);
      }
      hooks[scope][hooks[scope].length] = func;
    },
    
    get_hooks : function(scope) {
      if (!Toolbawks.assets.Interface.verify_hook_scope(scope)) {
        Toolbawks.error('Toolbawks.assets.Interface.get_hooks : Invalid scope while fetching hooks');
        return false;
      }
      return hooks[scope];
    },
    
    get_data_store : function() {
      return ds;
    },
    
    get_paging : function() {
      return paging;
    },

    get_grid : function() {
      return grid;
    },
    
    init : function() {
      Toolbawks.log('Toolbawks.assets.Interface.init()');
      
  	  Ext.QuickTips.init();

			Ext.query('.toolbawks_assets_manager').each(function(container_ext){
			  Toolbawks.log('Toolbawks.assets.Interface.init -> manager');
			  
			  var container_pt = $(container_ext.id);
			  
  			Toolbawks.assets.Interface.build(container_pt);
			
  			// Check if container has attribute uploader="true"
  		  var uploader = container_pt.readAttribute('uploader') == 'true' ? true : false;
		  
  			if (uploader == true) {
  			  // Show the AJAX uploader
  			  Toolbawks.assets.Uploader.build_container(container_pt, true);
  			}
		  });

			Ext.query('.toolbawks_assets_uploader').each(function(container_ext){
			  Toolbawks.log('Toolbawks.assets.Interface.init -> uploader');
			  
			  var container_pt = $(container_ext.id);
			  Toolbawks.assets.Uploader.build_container(container_pt, false);
			});
  		
  		// When this window reloads, clear the JS cache
  		Ext.EventManager.on(window, 'unload', function(){
        delete Toolbawks.assets.Interface;
        delete Toolbawks.assets.Model;
        delete Toolbawks.assets.Uploader;
      });
  	},

  	build: function(container_pt) {
  	  var container = container_pt;

  	  var id = container.id;
  	  filter = container.readAttribute('filter') == 'true' ? true : false;
	  
	    Toolbawks.log('Toolbawks.assets.Interface.build -> id : ' + id);    
	  
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
	  
      // trigger the data store load
      if (filter == true) {
        var parameters = {
          start: 0, 
          limit: 25,
          "association[klass]": association_klass, 
          "association[id]": association_id,
          "filter": filter
        }
      } else {
        var parameters = {
          start: 0, 
          limit: 25
        }
      }

      // create the Data Store
      ds = new Ext.data.Store({
          // load using script tags for cross domain, if the data in on the same domain as
          // this page, an HttpProxy would be better
          proxy: new Ext.data.HttpProxy({
              url: Toolbawks.assets.Model.base_url() + 'show'
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
          remoteSort: true,
          
          baseParams: parameters
      });
    
      ds.setDefaultSort('name', 'desc');

	    Toolbawks.log('Toolbawks.assets.Interface.build -> Ext.data.Store ...');

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
      
      Toolbawks.log('Toolbawks.assets.Interface.build -> Ext.grid.ColumnModel ...');	    

      // by default columns are sortable
      cm.defaultSortable = false;
    
      // Dynamically reset the width of the Assets column
      var newAssetColumnWidth = Ext.get(id).getWidth() - (cm.getTotalWidth(false) - cm.defaultWidth);
      cm.setColumnWidth(1, newAssetColumnWidth);
    
      // create the editor grid
      grid = new Ext.grid.Grid(id, {
        ds: ds,
        cm: cm,
        selModel: new Ext.grid.RowSelectionModel({
          singleSelect: true
        }),
        enableColLock: false,
        loadMask: true
      });

      Toolbawks.log('Toolbawks.assets.Interface.build -> Ext.grid.Grid ...');

      // make the grid resizable, do before render for better performance
      var rz = new Ext.Resizable(id, {
        wrap: true,
        minHeight: 200,
        pinned: true,
        handles: 's'
      });
    
      rz.on('resize', grid.autoSize, grid);

      Toolbawks.log('Toolbawks.assets.Interface.build -> Ext.Resizable ...');

      // render it
      grid.render();

      Toolbawks.log('Toolbawks.assets.Interface.build -> grid.render() ...');

      var gridFoot = grid.getView().getFooterPanel(true);
    
      // add a paging toolbar to the grid's footer
      paging = new Ext.PagingToolbar(gridFoot, ds, {
        pageSize: 25,
        displayInfo: true,
        displayMsg: 'Displaying assets {0} - {1} of {2}',
        emptyMsg: "No assets to display"
      });

      Toolbawks.log('Toolbawks.assets.Interface.build -> Ext.PagingToolbar ...');

      // add the remove asset button
      var remove_button = new Ext.Toolbar.Button({
        text: 'Remove',
        cls: 'x-btn-text-icon btn-remove'
      });
    
      remove_button.on('click', removeAsset);

      paging.add('-', remove_button);
      
      // Load the data
      ds.load();
    
      Toolbawks.log('Toolbawks.assets.Interface.build -> ds.load() ...');
      
      // run all the interface modifications
      Toolbawks.assets.Interface.get_hooks('init').each(function(hook) {
        Toolbawks.log('Toolbawks.assets.Interface.init -> running hook...');
        hook();
      });
    
      function removeAsset(btn, pressed) {
        var asset_row = grid.getSelectionModel().getSelected();
      
        if (!asset_row || !asset_row.id || asset_row.id == '') {
          Toolbawks.msg('Remove Asset', 'No asset selected to be removed');
          return false;
        }
      
        Toolbawks.assets.Model.destroy(asset_row.id);
        
        Toolbawks.assets.Interface.get_hooks('destroy').each(function(hook) {
          Toolbawks.log('Toolbawks.assets.Interface.destroy -> running hook...');
          hook(asset_row);
        });
        
        ds.remove(asset_row);
        --ds.totalLength;
        paging.updateInfo();
        grid.getView().refresh();
      }
  	},
	
  	add : function(data) {
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

      Toolbawks.assets.Interface.get_hooks('create').each(function(hook) {
        Toolbawks.log('Toolbawks.assets.Interface.create -> running hook...');
        hook(data);
      });

      ds.add(row);
      ++ds.totalLength;
    
  	  paging.updateInfo();
    }
  }
}();

Ext.onReady(Toolbawks.assets.Interface.init, Toolbawks.assets.Interface, true);