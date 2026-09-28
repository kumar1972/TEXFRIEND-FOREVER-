async function selectTexfriendFolder() {

    // 1. Android / Capacitor Mobile App Check
    const isCapacitor = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform());

    if (isCapacitor) {
        // Mobile-il internal app storage-ai direct-aaga set seigirom
        localStorage.setItem("texfriend_selected_folder", "Mobile App Storage (Internal/Documents)");
        localStorage.setItem("texfriend_save_mode", "mobile_internal");
        
        alert("📁 Mobile Storage Selected Successfully!\n\nFiles will be saved automatically in the Mobile App / Documents directory.");
        return { name: "Mobile App Storage" };
    }

    // 2. Desktop Chrome / Edge Browser Check
    // File System Access API (showDirectoryPicker) only exists on desktop
    // Chrome/Edge. It does not exist on Android Chrome, iOS Safari, or any
    // mobile browser.
    if (typeof window.showDirectoryPicker !== "function") {

        alert(
            "📁 Folder selection isn't supported on this browser/device.\n\n" +
            "This feature only works on desktop Chrome or Edge. " +
            "On mobile, please continue using cloud sync / backup-download instead."
        );

        return null;
    }

    // 3. Laptop / PC Browser Folder Picker Execution
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
        // User cancel seithaal error alert tharaamal console-il mattum kaattum
        if (err && err.name === "AbortError") {
            console.log("User cancelled folder selection request.");
            return null;
        }

        console.error("Folder selection or cloud sync failed", err);

        alert(
            "❌ Folder selection was cancelled or failed.\n\n" +
            (err && err.message ? err.message : "Please try again.")
        );

        return null;
    }
}
