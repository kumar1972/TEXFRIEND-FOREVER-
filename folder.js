async function selectTexfriendFolder() {

    // File System Access API (showDirectoryPicker) only exists on desktop
    // Chrome/Edge. It does not exist on Android Chrome, iOS Safari, or any
    // mobile browser. Without this check, tapping the button on mobile fails
    // silently (only a console.error, nothing visible on screen).
    if (typeof window.showDirectoryPicker !== "function") {

        alert(
            "📁 Folder selection isn't supported on this browser/device.\n\n" +
            "This feature only works on desktop Chrome or Edge. " +
            "On mobile, please continue using cloud sync / backup-download instead."
        );

        return null;
    }

    try {
        const handle = await window.showDirectoryPicker();
        console.log("Selected folder:", handle.name);
        
        // லோக்கல் ஸ்டோரேஜில் சேமித்தல்
        localStorage.setItem("texfriend_selected_folder", handle.name);
        
        // கிளவுட் ஸ்டோரேஜ் அல்லது சிங்க் பகுதிக்கான செயல்பாடு
        if (typeof syncToCloudStorage === "function") {
            await syncToCloudStorage(handle);
        }
        
        alert("Folder successfully selected & synchronized: " + handle.name);
        return handle;
    } catch (err) {
        console.error("Folder selection or cloud sync failed", err);

        alert(
            "❌ Folder selection was cancelled or failed.\n\n" +
            (err && err.message ? err.message : "Please try again.")
        );

        return null;
    }
}
