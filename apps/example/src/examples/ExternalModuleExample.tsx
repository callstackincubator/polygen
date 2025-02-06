// For this project we need TextDecoder polyfill
import '@bacons/text-decoder/install';

import { useReducer } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { initSync, sha256 } from 'simple-sha256-wasm';
import module from 'simple-sha256-wasm/simple_sha256_wasm_bg.wasm';

let loaded = false;

export default function ExternalModuleExample() {
  const [_, dispatch] = useReducer(() => {}, 0);

  return (
    <View style={styles.container}>
      <Text>
        This example loads a WebAssembly module from external npm package.
      </Text>
      <Text>Module loaded: {loaded ? 'true' : 'false'}</Text>
      <Button
        title="Load"
        onPress={() => {
          initSync({ module });
          loaded = true;
          dispatch();
        }}
      />
      {loaded && <Text>sha256(foo) = {sha256('foo')}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
});
