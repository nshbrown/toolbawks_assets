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
    
    @assets = Asset.find(:all, :conditions => filter[:conditions], :joins => filter[:joins], :order => "#{params[:sort]} #{params[:dir]}", :limit => params[:limit], :offset => params[:start]).inject([]) do |list, a| 
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
    filter = (params[:association]) ? association_config(params[:association][:klass]) : nil
    
    @asset = Asset.new(params[:asset])
    @asset_details = AssetDetail.new(params[:asset_detail])
    
    if @asset_details.save
      @asset.asset_detail_id = @asset_details.id 
    else

      @error = {
        :error => 'Unable to save asset details',
        :debug => @asset_details.errors
      }
      
      render :action => 'create', :layout => false, :status => 500
      return
    end
    
    @asset.name = @asset_details.filename if !@asset.name || @asset.name == ""
    
    if @asset.save
      if filter
        begin
          case filter[:association].macro
            when :has_and_belongs_to_many
              filter[:model].find(params[:association][:id]).send(filter[:association].name) << @asset
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
    @assets = Asset.find(:all)
  end
  
  def remove
    if Asset.find(params[:id]).destroy
      render :text => 'Asset has been removed'
    else
      render :text => 'Asset was not able to be removed', :status => 500
    end
  end
  
  private
  
    def association_config(klass)
      config = false
    
      # Verify that the id is a regular number
      return config if id.class != Fixnum
    
      # Verify that the klass passed in is indeed a class
      begin
        model = Kernel.const_get(klass)
      rescue
        return config
      end
    
      # Check the association exists between the model and the Asset 
      # based on the association type passed
      if model.reflections.collect { |r| r[1].class_name }.index("Asset")
        association = model.reflections.collect[model.reflections.collect { |r| r[1].class_name }.index("Asset")][1]
      else
        # No association found with this model
        return config
      end
    
      # Get the table name of the association
      table_name = association.options[:join_table]
    
      # Get the column to match the association in the table
      association_column = association.primary_key_name
    
      config = {
        :table => table_name,
        :column => association_column,
        :association => association,
        :model => model
      }
    end
  
    def filter_settings(klass, id)
      filter =  { 
        :joins => nil,
        :conditions => nil
      }
    
      config = association_config(klass)
    
      return filter if !config
    
      # Build the SQL for the filter
      case config[:association].macro
        when :has_and_belongs_to_many
          filter[:joins] = "JOIN #{config[:table]} on #{config[:table]}.asset_id = assets.id"
          filter[:conditions] = "#{config[:table]}.#{config[:column]} = #{id}"
        when :belongs_to
        when :has_many
      end

      return filter
    end
end