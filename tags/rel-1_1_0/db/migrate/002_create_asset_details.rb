class CreateAssetDetails < ActiveRecord::Migration
  def self.up
    if !AssetDetail.table_exists?
      create_table :asset_details do |t|
        t.column :parent_id,  :integer
        t.column :content_type, :string
        t.column :filename, :string    
        t.column :thumbnail, :string
        t.column :size, :integer
        t.column :created_at, :datetime
      end
    else
      existing_columns = AssetDetail.columns.inject([]) { |cols, c| cols << c.name }
      
      remove_column :asset_details, :path if existing_columns.include?('path')
      remove_column :asset_details, :description if existing_columns.include?('description')

      add_column :asset_details, :parent_id,  :integer if !existing_columns.include?('parent_id')
      add_column :asset_details, :content_type, :string if !existing_columns.include?('content_type')
      add_column :asset_details, :filename, :string if !existing_columns.include?('filename')
      add_column :asset_details, :thumbnail, :string if !existing_columns.include?('thumbnail')
      add_column :asset_details, :size, :integer if !existing_columns.include?('size')
      add_column :asset_details, :created_at, :datetime if !existing_columns.include?('created_at')
    end
  end

  def self.down
    drop_table :asset_details
  end
end
