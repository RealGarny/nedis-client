/*
function getFromMeta<T extends keyof ImportMetaEnv>(name: T): ImportMetaEnv[T] {
  const value = import.meta.env[name];
  if (value === undefined || value === "") throw new Error(`Missing env variable: ${name}`);
  return value;
}*/

export const appConfig = {
  appName: "Nedis",
} as const;
