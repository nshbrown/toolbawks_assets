class Asset < ActiveRecord::Base
  validates_presence_of :name
  belongs_to :details, :class_name => 'AssetDetail', :foreign_key => 'asset_detail_id', :dependent => :destroy
end