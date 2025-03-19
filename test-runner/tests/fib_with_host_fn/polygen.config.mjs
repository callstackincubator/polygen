import {
    localModule,
    polygenConfig,
} from '@callstack/polygen-config';

/**
 * @type {import('@callstack/polygen/config').PolygenConfig}
 */
export default polygenConfig({
    modules: [
        localModule('./module.wasm'),
    ],
});
