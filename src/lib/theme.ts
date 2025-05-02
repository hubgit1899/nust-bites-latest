// theme.ts
export const DEFAULT_LIGHT = "cupcake";
export const DEFAULT_DARK = "night";

export async function getThemes() {
  try {
    const res = await fetch("/api/get-admin-settings");
    const data = await res.json();

    return {
      LIGHT_THEME:
        data.lightTheme === "default" ? DEFAULT_LIGHT : data.lightTheme,
      DARK_THEME: data.darkTheme === "default" ? DEFAULT_DARK : data.darkTheme,
    };
  } catch (error) {
    console.error("Failed to fetch theme settings, using default.", error);
    return {
      LIGHT_THEME: DEFAULT_LIGHT,
      DARK_THEME: DEFAULT_DARK,
    };
  }
}
