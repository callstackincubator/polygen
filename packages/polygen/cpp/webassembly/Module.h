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

class Module: public facebook::jsi::NativeState {
public:
  enum class SymbolKind {
    Function, Table, Memory, Global
  };
  
  struct ExportInfo {
    std::string name;
    SymbolKind kind;
    
    ExportInfo(const std::string& name, SymbolKind kind): name(name), kind(kind) {}
    ExportInfo(std::string&& name, SymbolKind kind): name(std::move(name)), kind(kind) {}
  };
    
  struct ImportInfo {
    std::string module;
    std::string name;
    SymbolKind kind;
    
    ImportInfo(const std::string& module, const std::string& name, SymbolKind kind)
    : module(module), name(name), kind(kind) {}
    
    ImportInfo(std::string&& module, std::string&& name, SymbolKind kind)
    : module(std::move(module)), name(std::move(name)), kind(kind) {}
  };
  
  explicit Module(const std::string& name) : name_(name) {}
  explicit Module(std::string&& name) : name_(std::move(name)) {}
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
  
  virtual const std::vector<ImportInfo>& getImports() const = 0;
  virtual const std::vector<ExportInfo>& getExports() const = 0;
  virtual void createInstance(facebook::jsi::Runtime& rt, facebook::jsi::Object& target, facebook::jsi::Object&& importObject) const = 0;
  
protected:
  std::string name_;
};

}
