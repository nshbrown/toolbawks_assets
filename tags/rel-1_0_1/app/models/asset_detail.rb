class AssetDetail < ActiveRecord::Base
  has_one :asset, :dependent => :destroy
  
  has_attachment :path_prefix => 'public/assets',
                 :storage => :file_system, 
                 :max_size => 10.megabyte,
                 :thumbnails => {
                   :thumb => '50x50',
                   :tiny => '32x32>',
                   :small => '200x200>',
                   :medium => '640x480>',
                   :large => '800x600>'
                 }

  validates_as_attachment
end