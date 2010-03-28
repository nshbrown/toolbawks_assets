module ApplicationHelper
  def form_for_asset_upload(options = {})
    if options[:manager] == true
      options[:form_class] = 'toolbawks_asset_manager_uploader' 
    else 
      options[:form_class] = 'toolbawks_asset_uploader'
    end
    
    model_attributes = 'model="' + options[:model] + '" model_id="' + options[:model_id] + '"' if options[:model] && options[:model_id]
    
    <<-EOF
    <div class="#{options[:form_class]}" #{model_attributes}></div>
EOF
  end
  
  def asset_toolbawks_head
    <<-EOL
      #{ stylesheet_link_tag 'asset_toolbawks', :plugin => 'asset_toolbawks' }
      #{ javascript_include_tag 'asset_toolbawks', 'behaviours', :plugin => 'asset_toolbawks' }
EOL
  end
end