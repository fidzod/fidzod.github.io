declare module '*.md' {
  import type { Component } from 'svelte';
  const component: Component;
  export default component;
}

declare module '*.yaml' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: any;
  export default value;
}
