def install_polygen()
  pre_install do |installer|
    system("polygen generate")
  end

  pod 'ReactNativeWebAssemblyHost', :path => "../node_modules/.polygen-out/host"
#   pod 'ReactNativePolygen/Runtime'
end
