import { useCallback } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import example from '../example.wasm';

export default function ImportValidationExample() {
  const loadModuleMissingImport = useCallback(async () => {
    await WebAssembly.instantiate(example, {});
  }, []);

  const loadModuleInvalidImport = useCallback(async () => {
    await WebAssembly.instantiate(example, { host: { add: 5 } });
  }, []);

  return (
    <View style={styles.container}>
      <Button
        title="Load module (missing import)"
        onPress={loadModuleMissingImport}
      />
      <Button
        title="Load module (invalid import)"
        onPress={loadModuleInvalidImport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});
