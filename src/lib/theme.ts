// theme.ts
import axios from "axios";

export const DEFAULT_LIGHT: string = "cupcake";
export const DEFAULT_DARK: string = "dim";

export async function getThemes() {
  try {
    const response = await axios.get("/api/get-admin-settings");

    const { success, data } = response.data;

    if (!success || !data) {
      throw new Error("Invalid theme data");
    }

    return {
      LIGHT_THEME:
        data.lightTheme === "default" ? DEFAULT_LIGHT : data.lightTheme,
      DARK_THEME: data.darkTheme === "default" ? DEFAULT_DARK : data.darkTheme,
    };
  } catch (error) {
    console.error("❌ Failed to fetch theme settings, using defaults:", error);
    return {
      LIGHT_THEME: DEFAULT_LIGHT,
      DARK_THEME: DEFAULT_DARK,
    };
  }
}
