import { open } from "@tauri-apps/plugin-dialog";

export async function pickFolder(
  callback: (selectedDirectory: string) => void,
) {
  try {
    const selectedDirectory = await open({
      directory: true,
      multiple: false,
    });

    if (selectedDirectory) {
      console.log("Selected folder path:", selectedDirectory);
      callback(selectedDirectory);
    } else {
      console.log("User canceled the folder selection.");
    }
  } catch (error) {
    console.error("Failed to pick directory:", error);
  }
}
