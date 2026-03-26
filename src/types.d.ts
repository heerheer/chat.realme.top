declare module "*.svg" {
  const content: string;
  export default content;
}

declare namespace Bun {
  interface Env {
    BUN_PUBLIC_OPENAI_BASE_URL: string;
  }
}
