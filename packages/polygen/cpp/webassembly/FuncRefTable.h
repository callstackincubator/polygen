#pragma once

#include <optional>
#include <jsi/jsi.h>
#include <ReactNativePolygen/wasm-rt.h>
#include "Table.h"

namespace callstack::polygen {

class FuncRefState: public facebook::jsi::NativeState {
public:
  explicit FuncRefState(wasm_rt_funcref_t ref): funcRef(ref) {}
  
  wasm_rt_funcref_t funcRef;
};

class FuncRefTable: public Table {
public:
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
  
  std::shared_ptr<facebook::jsi::NativeState> getElement(size_t index) const override {
    return std::make_shared<FuncRefState>(this->table_->data[index]);
  }
  
  void grow(ptrdiff_t delta) {
    wasm_rt_grow_funcref_table(this->table_, delta, { nullptr, nullptr, nullptr, nullptr });
  }
  
protected:
  std::optional<size_t> maxSize_;
  wasm_rt_funcref_table_t ownedTable_;
  wasm_rt_funcref_table_t* table_;
};

}
