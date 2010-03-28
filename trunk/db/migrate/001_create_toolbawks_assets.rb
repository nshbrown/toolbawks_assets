class CreateToolbawksAssets < ActiveRecord::Migration
  def self.up
    if !ToolbawksAsset.table_exists?
      create_table :toolbawks_assets do |t|
        t.column :name,  :string
        t.column :description, :text
        t.column :toolbawks_asset_detail_id, :integer
        t.column :created_at, :datetime
        t.column :modified_at, :datetime
      end
    else
      existing_columns = ToolbawksAsset.columns.inject([]) { |cols, c| cols << c.name }
      
      remove_column :toolbawks_assets, :path if existing_columns.include?('path')

      add_column :toolbawks_assets, :name,  :string if !existing_columns.include?('name')
      add_column :toolbawks_assets, :description, :text if !existing_columns.include?('description')
      add_column :toolbawks_assets, :toolbawks_asset_detail_id, :integer if !existing_columns.include?('toolbawks_asset_detail_id')
      add_column :toolbawks_assets, :created_at, :datetime if !existing_columns.include?('created_at')
      add_column :toolbawks_assets, :modified_at, :datetime if !existing_columns.include?('modified_at')
    end
  end

  def self.down
    drop_table :toolbawks_assets
  end
end
