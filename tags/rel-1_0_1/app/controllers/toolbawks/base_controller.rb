class Toolbawks::BaseController < ApplicationController
  before_filter :login_required,
								:except => [:login]
	before_filter :check_authorization, 
								:except => [:login, :index]
end