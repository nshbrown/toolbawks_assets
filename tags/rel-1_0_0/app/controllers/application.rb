class ApplicationController < ActionController::Base
  def login_required
    return true
  end

  def check_authorization
    return true
  end
end