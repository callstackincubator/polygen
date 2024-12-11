import { useCallback, useState } from 'react';
import { Button, Text, View } from 'react-native';
import EXAMPLE_WASM_BUFFER from '../example-wasm-buffer';

export default function FetchModuleExample() {
  const [module, setModule] = useState<WebAssembly.Module>();
  const loadModule = useCallback(() => {
    setModule(new WebAssembly.Module(EXAMPLE_WASM_BUFFER));
  }, []);

  return (
    <View>
      <Button title="Load valid module" onPress={loadModule} />
      <Text>Loaded: {module ? 'true' : 'false'}</Text>
      {!!module && (
        <Text>
          Exports: {JSON.stringify(WebAssembly.Module.exports(module))}
        </Text>
      )}
      {/*<Button title="Load invalid module" />*/}
    </View>
  );
}
