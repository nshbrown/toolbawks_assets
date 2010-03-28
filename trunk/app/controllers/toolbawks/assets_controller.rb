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

class Toolbawks::AssetsController < Toolbawks::BaseController
  layout 'toolbawks_assets'

  def index
    list
    render :action => 'list'
  end

  def show
    filter = (params[:filter] == "true") ? filter_settings(params[:association][:klass], params[:association][:id]) : { :conditions => nil, :joins => nil }
    
    params[:sort] = 'name' if !params[:sort] || !['name', 'created_by'].include?(params[:sort])
    params[:dir] = 'ASC' if !params[:dir] || !['ASC', 'DESC'].include?(params[:dir])
    
    @assets = ToolbawksAsset.find(:all, :conditions => filter[:conditions], :joins => filter[:joins], :order => "#{params[:sort]} #{params[:dir]}", :limit => params[:limit], :offset => params[:start]).inject([]) do |list, a| 
      list << { :id => a.id,
                :name => a.name, 
                :description => a.description,
                :thumbnail => (a.details.image?) ? a.details.public_filename(:thumb) : false,
                :created_at => (a.created_at) ? a.created_at.strftime("%B, %d %Y %I:%M:%S") : false,
                :modified_at => (a.modified_at) ? a.modified_at.strftime("%B, %d %Y %I:%M:%S") : false
              }
    end
    
    data = {
      :totalCount => @assets.length,
      :assets => @assets
    }
    
    render :text => data.to_json
  end
  
  def create
    filter = (params[:association]) ? association_config(params[:association][:klass], 'ToolbawksAsset') : nil
    
    @asset = ToolbawksAsset.new(params[:asset])
    @asset_details = ToolbawksAssetDetail.new(params[:asset_detail])
    
    if @asset_details.save
      @asset.toolbawks_asset_detail_id = @asset_details.id 
    else

      @error = {
        :error => 'Unable to save asset details',
        :debug => @asset_details.errors
      }
      
      render :action => 'create', :layout => false, :status => 500
      return
    end
    
    @asset.name = @asset_details.filename if !@asset.name || @asset.name == ""
    
    logger.info '[toolbawks_assets] about to save...'
    
    if @asset.save
      logger.info '[toolbawks_assets] asset saved...'
      
      @association_item = nil
      
      if filter
        logger.info '[toolbawks_assets] filter'
        
        begin
          logger.info '[toolbawks_assets] association attachment begins.. for ' + filter[:association].macro.to_s
          case filter[:association].macro
            when :has_and_belongs_to_many
              logger.info '[toolbawks_assets] association attachment when has_and_belongs_to_many..'
              @association_item = filter[:model].find(params[:association][:id])
              @association_item.send(filter[:association].name) << @asset
            when :belongs_to
              @association_item = filter[:model].find(params[:association][:id])
              @association_item.update_attributes(filter[:association].options[:foreign_key].to_sym => @asset.id)
          end
        rescue
          logger.info 'An error occurred trying to associate the asset with the klass'
        end
      end

      @success = { 
        :uploader_count => params[:uploader_count], 
        :asset => {
          :id => @asset.id, 
          :name => @asset.name, 
          :description => @asset.description, 
          :thumbnail => (@asset.details.image?) ? @asset.details.public_filename(:thumb) : false,
          :filename => @asset.details.filename,
          :small => (@asset.details.image?) ? @asset.details.public_filename(:small) : false,
          :created_at => (@asset.created_at) ? @asset.created_at.strftime("%B, %d %Y %I:%M:%S") : false,
          :modified_at => (@asset.modified_at) ? @asset.modified_at.strftime("%B, %d %Y %I:%M:%S") : false
        },
        :association => params[:association]
      }
    else
      @error = {
        :error => 'Unable to save asset',
        :debug => @asset.errors
      }
      
      render :action => 'create', :layout => false, :status => 500
      return
    end
    
    render :action => 'create', :layout => false
  end
  
  def list
    @assets = ToolbawksAsset.find(:all)
  end
  
  def remove
    if ToolbawksAsset.find(params[:id]).destroy
      render :text => 'ToolbawksAsset has been removed'
    else
      render :text => 'ToolbawksAsset was not able to be removed', :status => 500
    end
  end
  
  def popup
    @asset = ToolbawksAsset.find(params[:id])
    render :layout => 'toolbawks_assets_popup'
  rescue
    render :action => 'popup_not_found', :layout => 'toolbawks_assets_popup'
  end
  
  private
  
    def filter_settings(klass, id)
      filter =  { 
        :joins => nil,
        :conditions => nil
      }

      # Verify that the id is a regular number
      if id.class != Fixnum && !id.match(/^[0-9]+$/)
        logger.info 'Toolbawks::ToolbawksAssets.filter_settings -> Id passed is not a number : ' + id.inspect
        return config 
      end
      
      config = association_config(klass, 'ToolbawksAsset')
      
      if !config
        logger.info 'Toolbawks::ToolbawksAssets.filter_settings -> Unable to find config based on Klass: ' + klass + ', Id: ' + id
        return filter 
      end
    
      # Build the SQL for the filter
      case config[:association].macro
        when :has_and_belongs_to_many
          filter[:joins] = "JOIN #{config[:table]} on #{config[:table]}.asset_id = assets.id"
          filter[:conditions] = "#{config[:table]}.#{config[:column]} = #{id}"
        when :belongs_to
          logger.info 'Toolbawks::ToolbawksAssets.filter_settings -> Association is belongs_to [unconfigured]'
        when :has_many
          logger.info 'Toolbawks::ToolbawksAssets.filter_settings -> Association is has_many [unconfigured]'
      end

      return filter
    end
    
  	# Called via AJAX. 
  	# Set the default flag for this asset
    def default
      asset = ToolbawksAsset.find(params[:id])
      default = (asset.default ? false : true)
  		asset.update_attributes!(:default => default)

  		# Render nothing to denote success
      render :text => "Successfully set the default flag for the asset"
    end
end