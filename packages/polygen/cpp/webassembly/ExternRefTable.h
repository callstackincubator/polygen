#pragma once

#include <jsi/jsi.h>
#include <ReactNativePolygen/wasm-rt.h>
#include "Table.h"

namespace facebook::react {

class ExternRefTable: public Table {
public:
  explicit ExternRefTable(wasm_rt_externref_table_t* table): table_(table) {}
  explicit ExternRefTable(size_t initialSize, std::optional<size_t> maxSize = std::nullopt): maxSize_(maxSize) {
    this->table_ = &this->ownedTable_;
    wasm_rt_allocate_externref_table(this->table_, initialSize, maxSize.value_or(Table::DEFAULT_MAX_SIZE));
  }
  
  ~ExternRefTable() {
    if (this->isOwned()) {
      wasm_rt_free_externref_table(this->table_);
    }
  }
  
  bool isOwned() const override {
    return &ownedTable_ == table_;
  }
  
  Kind getKind() const override {
    return Kind::ExternRef;
  }
  
  size_t getSize() const override {
    return this->table_->size;
  }
  
  size_t getCapacity() const override {
    return this->table_->max_size;
  }
  
  wasm_rt_externref_t getElement(size_t index) {
    return this->table_->data[index];
  }
  
  void grow(ptrdiff_t delta) override {
    wasm_rt_grow_externref_table(table_, delta, nullptr);
  }
  
protected:
  std::optional<size_t> maxSize_;
  wasm_rt_externref_table_t ownedTable_;
  wasm_rt_externref_table_t* table_;
};

}
