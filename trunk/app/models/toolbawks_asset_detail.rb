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

class ToolbawksAssetDetail < ActiveRecord::Base
  has_one :asset, :class_name => 'ToolbawksAsset', :foreign_key => 'toolbawks_asset_detail_id'
  
  has_attachment :path_prefix => 'public/toolbawks_asset_details',
                 :storage => :file_system, 
                 :max_size => 10.megabyte,
                 :thumbnails => {
                   :thumb => '50x50',
                   :tiny => '100x100>',
                   :small => '200x200>',
                   :medium => '375x375>',
                   :large => '640x480>',
                   :huge => '800x600>'
                 }

  validates_as_attachment
end