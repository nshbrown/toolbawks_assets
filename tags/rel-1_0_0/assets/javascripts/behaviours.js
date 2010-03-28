var asset_toolbawks_selectors = {
  '.toolbawks_asset_manager_destroy' : function(element) {
    alert('true');
  },
  
  '.toolbawks_asset_manager_destroy:click' : function(element, evt) {
    var asset_id = element.readAttribute('asset_id');
    AssetManager.destroy(asset_id);
    Event.stop(evt);
    return false;
  }
};

EventSelectors.addRules(asset_toolbawks_selectors);