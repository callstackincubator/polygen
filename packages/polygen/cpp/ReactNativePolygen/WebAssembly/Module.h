/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <string>
#include <jsi/jsi.h>

namespace callstack::polygen {

/**
 * Represents a WebAssembly Module.
 *
 * This class contains information about module shape, and can be used to create module instance.
 */
class Module: public facebook::jsi::NativeState {
public:
  enum class SymbolKind {
    Function, Table, Memory, Global
  };
  
  using Factory = std::function<void (facebook::jsi::Runtime& rt, facebook::jsi::Object& target, facebook::jsi::Object&& importObject)>;
  
  struct Export {
    std::string name;
    SymbolKind kind;
    
    Export(const std::string& name, SymbolKind kind): name(name), kind(kind) {}
    Export(std::string&& name, SymbolKind kind): name(std::move(name)), kind(kind) {}
  };
    
  struct Import {
    std::string module;
    std::string name;
    SymbolKind kind;
    
    Import(const std::string& module, const std::string& name, SymbolKind kind)
    : module(module), name(name), kind(kind) {}
    
    Import(std::string&& module, std::string&& name, SymbolKind kind)
    : module(std::move(module)), name(std::move(name)), kind(kind) {}
  };
  
  Module(const std::string& name,
         std::vector<Import>&& imports,
         std::vector<Export>&& exports,
         Factory&& factory
  ) : name_(name), imports_(std::move(imports)), exports_(std::move(exports)), factory_(std::move(factory)) {}
  Module(std::string&& name,
         std::vector<Import>&& imports,
         std::vector<Export>&& exports,
         Factory&& factory
  ) : name_(std::move(name)), imports_(std::move(imports)), exports_(std::move(exports)), factory_(std::move(factory)) {}
  virtual ~Module() {}

  // Allow moving
  Module(Module&& other) = default;
  Module& operator=(Module&& other) = default;

  // Disallow copying
  Module(const Module& other) = delete;
  Module& operator=(const Module& other) = delete;
  
  const std::string& getName() const {
    return name_;
  }
  
  const std::vector<Import>& getImports() const {
    return imports_;
  }
  
  const std::vector<Export>& getExports() const {
    return exports_;
  }
  
  void createInstance(facebook::jsi::Runtime& rt, facebook::jsi::Object& target, facebook::jsi::Object&& importObject) const {
    factory_(rt, target, std::move(importObject));
  }
  
protected:
  std::string name_;
  std::vector<Import> imports_;
  std::vector<Export> exports_;
  Factory factory_;
};

}
