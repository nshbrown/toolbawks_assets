module ApplicationHelper
  mattr_accessor :asset_toolbawks_viewer_count
  self.asset_toolbawks_viewer_count = 0
  
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
  
  def asset_toolbawks_viewer(options = {})
    html_options = {}
    
    # Assign the options only if they are valid 
    html_options[:id] = options[:id] if options[:id]
    html_options[:uploader] = options[:uploader] if [true, false].include?(options[:uploader])
    html_options[:name] = options[:name] if [true, false].include?(options[:name])
    html_options[:description] = options[:description] if [true, false].include?(options[:description])
    html_options[:filter] = options[:filter] if [true, false].include?(options[:filter])
    html_options[:association_klass] = options[:association_klass] if options[:association_klass]
    html_options[:association_id] = options[:association_id] if options[:association_id]
    
    # If both the klass and id are passed, assume they are filtering
    if html_options[:association_klass] && html_options[:association_id]
      html_options[:filter] = true
    end
    
    # If no id is set, make one up
    if !html_options[:id]
      html_options[:id] = "asset_toolbawks_viewer_#{get_asset_toolbawks_viewer_count}"
    end
    
    # Check to make sure the filter options exist if we are explicitly filtering the results
    if html_options[:filter] && (!html_options[:association_klass] || !html_options[:association_id])
      return 'Error: Invalid association values for filter'
      logger.info '[asset_toolbawks] asset_toolbawks_viewer : html_options -> ' + html_options.inspect
    end
    
    # Check to make sure that the klass passed through is a valid model
    if html_options[:filter]
      begin
        Kernel.const_get(html_options[:association_klass])
      rescue
        return 'Error: Invalid association klass for filter'
        logger.info '[asset_toolbawks] asset_toolbawks_viewer : html_options -> ' + html_options.inspect
      end
    end
    
    # Ensure that the filter association id is valid
    return 'Error: Invalid association id for filter' if html_options[:filter] && html_options[:association_id] <= 0 && options[:association_id].class != Fixnum
    
    attributes = html_options.map.inject([]) { |os, o| os << o[0].to_s + '="' + o[1].to_s + '"' }.join(' ')
    
    '<div class="toolbawks_asset_manager" ' + attributes + '></div>'
  end
  
  private
  
  def get_asset_toolbawks_viewer_count
    ApplicationHelper.asset_toolbawks_viewer_count += 1
  end
end