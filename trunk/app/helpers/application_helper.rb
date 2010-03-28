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

module ApplicationHelper
  mattr_accessor :toolbawks_assets_viewer_count
  self.toolbawks_assets_viewer_count = 0
  
  def form_for_asset_upload(options = {})
    if options[:manager] == true
      options[:form_class] = 'toolbawks_assets_manager_uploader' 
    else 
      options[:form_class] = 'toolbawks_assets_uploader'
    end
    
    if options[:entity]
      options[:association_klass] = options[:entity].class.to_s if !options[:association_klass]
      options[:association_id] = options[:entity].id.to_s if !options[:association_id]
    end
    
    model_attributes = ''
    model_attributes += 'id="' + options[:form_class].to_s + '"'
    model_attributes += ' association_klass="' + options[:association_klass] + '"' if options[:association_klass]
    model_attributes += ' association_id="' + options[:association_id] + '"' if options[:association_id]
    model_attributes += ' name="true"' if options[:name]
    model_attributes += ' description="true"' if options[:description]
    model_attributes += ' file_input_size="' + options[:file_input_size].to_s + '"' if options[:file_input_size]
    model_attributes += ' name_label="true"' if options[:name_label]
    
    <<-EOF
    <div class="#{options[:form_class]}" #{model_attributes}></div>
EOF
  end
  
  def toolbawks_assets_head
    <<-EOL
      #{ stylesheet_link_tag 'Toolbawks.assets.Viewer.css', :plugin => 'toolbawks_assets' }
      #{ javascript_include_tag 'Toolbawks.assets.js', 'Toolbawks.assets.Viewer.js', :plugin => 'toolbawks_assets' }

      #{ stylesheet_link_tag 'Toolbawks.assets.Interface.css', 'Toolbawks.assets.Uploader.css', :plugin => 'toolbawks_assets' if is_admin? }
      #{ javascript_include_tag 'Toolbawks.assets.Interface.js', 'Toolbawks.assets.Model.js', 'Toolbawks.assets.Uploader.js', :plugin => 'toolbawks_assets' if is_admin? }

      #{ stylesheet_link_tag 'lightbox', :plugin => 'toolbawks_core' }
      #{ javascript_include_tag 'lightbox', :plugin => 'toolbawks_core' }
EOL
  end
  
  def toolbawks_assets_viewer(options = {})
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
      html_options[:id] = "toolbawks_assets_viewer_#{get_toolbawks_assets_viewer_count}"
    end
    
    # Check to make sure the filter options exist if we are explicitly filtering the results
    if html_options[:filter] && (!html_options[:association_klass] || !html_options[:association_id])
      return 'Error: Invalid association values for filter'
      logger.info '[toolbawks_assets] toolbawks_assets_viewer : html_options -> ' + html_options.inspect
    end
    
    # Check to make sure that the klass passed through is a valid model
    if html_options[:filter]
      begin
        klass = html_options[:association_klass]
        collection = false
        
        # IF we are passing the collection as well, split it and ensure that the klass exists, as well as the collection
        if klass.include?('.')
          klass, collection = klass.split('.')
        end
        
        # Grab the model to ensure it exists and can be found
        model = Kernel.const_get(klass)
        
        # Grab and test the collection
        if collection
          if !model.reflections.collect { |r| r[1].name.to_s }.index(collection) 
            logger.info '[toolbawks_assets] toolbawks_assets_viewer : html_options -> ' + html_options.inspect
            return 'Error: Invalid klass collection for filter'
          end
        end
        
      rescue
        logger.info '[toolbawks_assets] toolbawks_assets_viewer : html_options -> ' + html_options.inspect
        return 'Error: Invalid association klass for filter'
      end
    end
    
    # Ensure that the filter association id is valid
    return 'Error: Invalid association id for filter' if html_options[:filter] && html_options[:association_id] <= 0 && options[:association_id].class != Fixnum
    
    attributes = html_options.map.inject([]) { |os, o| os << o[0].to_s + '="' + o[1].to_s + '"' }.join(' ')
    
    '<div class="toolbawks_assets_manager" ' + attributes + '></div>'
  end
  
  private
  
  def get_toolbawks_assets_viewer_count
    ApplicationHelper.toolbawks_assets_viewer_count += 1
  end
end