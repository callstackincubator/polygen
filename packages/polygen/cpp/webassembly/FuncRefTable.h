/*
 * Copyright (c) callstack.io.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <optional>
#include <jsi/jsi.h>
#include <ReactNativePolygen/wasm-rt.h>
#include "Table.h"

namespace callstack::polygen {

class FuncRefTable: public Table {
public:
  class Element: public TableElement {
  public:
    explicit Element(wasm_rt_funcref_t ref): funcRef(ref) {}
    
    wasm_rt_funcref_t funcRef;
  };
  
  explicit FuncRefTable(wasm_rt_funcref_table_t* table): table_(table) {}
  explicit FuncRefTable(size_t initialSize, std::optional<size_t> maxSize = std::nullopt): maxSize_(maxSize) {
    this->table_ = &this->ownedTable_;
    wasm_rt_allocate_funcref_table(this->table_, initialSize, maxSize.value_or(Table::DEFAULT_MAX_SIZE));
  }
  
  ~FuncRefTable() {
    if (this->isOwned()) {
      wasm_rt_free_funcref_table(this->table_);
    }
  }
  
  bool isOwned() const override {
    return &ownedTable_ == table_;
  }
  
  Kind getKind() const override {
    return Kind::FuncRef;
  }
  
  size_t getSize() const override {
    return this->table_->size;
  }
  
  size_t getCapacity() const override {
    return this->table_->max_size;
  }
  
  void grow(ptrdiff_t delta) {
    wasm_rt_grow_funcref_table(this->table_, delta, { nullptr, nullptr, nullptr, nullptr });
  }
  
  std::shared_ptr<TableElement> getElement(size_t index) const override {
    return std::make_shared<Element>(this->table_->data[index]);
  }
  
  void setElement(size_t index, std::shared_ptr<TableElement> element) override {
    if (auto funcElement = std::dynamic_pointer_cast<Element>(element); funcElement) {
      this->table_->data[index] = funcElement->funcRef;
      return;
    }
    
    throw TableElementTypeError {"Passed invalid element type to Table of 'anyfunc' elementtype."};
  }
  
  wasm_rt_funcref_table_t* getTableData() {
    return table_;
  }
  
  
protected:
  std::optional<size_t> maxSize_;
  wasm_rt_funcref_table_t ownedTable_;
  wasm_rt_funcref_table_t* table_;
};

}
