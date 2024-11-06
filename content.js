document.addEventListener("selectionchange", () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    // console.log("Selected text detected:", selectedText);
    chrome.runtime.sendMessage({
      action: "checkSelection",
      selectionText: selectedText
    });
  }
});
