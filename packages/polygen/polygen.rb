def install_polygen()
  pre_install do |installer|
  end

  pod 'ReactNativeWebAssemblyHost', :path => "../node_modules/.polygen-out/@host"
end
