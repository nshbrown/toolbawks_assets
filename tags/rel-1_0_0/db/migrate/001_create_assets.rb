class CreateAssets < ActiveRecord::Migration
  def self.up
    if !Asset.table_exists?
      create_table :assets do |t|
        t.column :name,  :string
        t.column :description, :text
        t.column :asset_detail_id, :integer
        t.column :created_at, :datetime
        t.column :modified_at, :datetime
      end
    else
      existing_columns = Asset.columns.inject([]) { |cols, c| cols << c.name }
      
      remove_column :assets, :path if existing_columns.include?('path')

      add_column :assets, :name,  :string if !existing_columns.include?('name')
      add_column :assets, :description, :text if !existing_columns.include?('description')
      add_column :assets, :asset_detail_id, :integer if !existing_columns.include?('asset_detail_id')
      add_column :assets, :created_at, :datetime if !existing_columns.include?('created_at')
      add_column :assets, :modified_at, :datetime if !existing_columns.include?('modified_at')
    end
  end

  def self.down
    drop_table :assets
  end
end
