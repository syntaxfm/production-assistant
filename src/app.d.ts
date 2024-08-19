// See https://kit.svelte.dev/docs/types#app
// Import the relevant types

// for information about these interfaces
declare global {
  interface Document {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startViewTransition: (callback: any) => void; // Add your custom property/method here
  }
}

export {};
