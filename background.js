function padStringToFixedLength(inputString, fixedLength) {
  const str = String(inputString); // Convert input to a string
  const paddingLength = fixedLength - str.length; // Calculate required padding

  // Ensure padding length is not negative (in case input is longer than fixed length)
  return paddingLength > 0 ? str.padEnd(fixedLength, " ") : str;
}

function trimToMaxLength(inputString, maxLength = 50) {
  return inputString.length > maxLength 
    ? inputString.substring(0, maxLength) 
    : inputString;
}

// Helper function to create a date object from extracted parts
function createDateTime(year, month, day, hours, minutes, seconds) {
  const now = new Date();
  return new Date(
    year ?? now.getFullYear(),
    month ?? now.getMonth(),
    day ?? now.getDate(),
    hours ?? now.getHours(),
    minutes ?? now.getMinutes(),
    seconds ?? now.getSeconds()
  );
}

// Helper function to check if text is in time-only format
function parseDateTime(input) {
  const now = new Date(); // Get the current date and time
  let date, time, hours, minutes, seconds;

  // Define regular expressions for different date and time formats
  const timeOnlyRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*([APap][mM])?$/; // Time formats (HH:mm or HH:mm AM/PM)
  const timeWithSecondsRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9])\s*([APap][mM])?$/; // Time with seconds (HH:mm:ss AM/PM)
  const timeWithUnicodeAMPMRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s*[\u202F\s]?(AM|PM|am|pm)$/; // Time with non-breaking space and AM/PM (6:07 AM)
  const fullDateTimeRegex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{1,2}),\s(\d{4})\s(0?[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9])\s*([APap][mM])?$/; // Full datetime (Nov 04, 2024 02:34:57 pm)
  const dayDateRegex = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s([A-Za-z]+)\s(\d{1,2}),\s(\d{4})$/; // Day and date (Monday, Nov 4, 2024)
  const monthYearRegex = /^([A-Za-z]+),\s(\d{4})$/; // Month and year only (November, 2024)
  
  try {
    // Check the input format and parse accordingly
    // if(!isNaN(anyDateParser(input))) {
    //   date = anyDateParser(input);
    // } else
    if (!isNaN(new Date(input))) {
      date = new Date(input);
  
    } else if (fullDateTimeRegex.test(input)) {
      const match = input.match(fullDateTimeRegex);
      const month = new Date(`${match[1]} 1, 2000`).getMonth();
      date = createDateTime(
        parseInt(match[3]), month, parseInt(match[2]),
        match[4] % 12 + (match[7] && match[7].toLowerCase() === 'pm' ? 12 : 0),
        parseInt(match[5]), parseInt(match[6])
      );
  
    } else if (dayDateRegex.test(input)) {
      const match = input.match(dayDateRegex);
      const month = new Date(`${match[2]} 1, 2000`).getMonth();
      date = createDateTime(parseInt(match[4]), month, parseInt(match[3]));
  
    } else if (monthYearRegex.test(input)) {
      const match = input.match(monthYearRegex);
      const month = new Date(`${match[1]} 1, 2000`).getMonth();
      date = createDateTime(parseInt(match[2]), month, 1);
  
    } else if (timeWithSecondsRegex.test(input)) {
      const match = input.match(timeWithSecondsRegex);
      hours = parseInt(match[1]) % 12 + (match[4] && match[4].toLowerCase() === 'pm' ? 12 : 0);
      minutes = parseInt(match[2]);
      seconds = parseInt(match[3]);
      if (!match[4] && match[1] === "12") hours = 12; // Default 12:xx:xx to PM
      date = createDateTime(null, null, null, hours, minutes, seconds);
  
    } else if (timeWithUnicodeAMPMRegex.test(input)) {
      const match = input.match(timeWithUnicodeAMPMRegex);
      hours = parseInt(match[1]) % 12 + (match[3].toLowerCase() === 'pm' ? 12 : 0);
      minutes = parseInt(match[2]);
      date = createDateTime(null, null, null, hours, minutes);
  
    } else if (timeOnlyRegex.test(input)) {
      const match = input.match(timeOnlyRegex);
      hours = parseInt(match[1]) % 12 + (match[3] && match[3].toLowerCase() === 'pm' ? 12 : 0);
      minutes = parseInt(match[2]);
      if (!match[3] && match[1] === "12") hours = 12; // Default 12:xx to PM if no AM/PM
      date = createDateTime(null, null, null, hours, minutes);
  
    } else {
      // If no format matches, return the current date and time
      date = NaN;
    }

    return date;

  } catch (error) {
    message = "Date parsing error:" + error.message;
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png", // Provide an icon image
      title: "Date Conversion Error",
      message: message,
      priority: 1
    });
    return NaN; // Return NaN for any parsing errors
  }
  return date;
}


// Function to show conversion results as an alert on the page
function showConversionResults(message) {
  
  // Copy the UTC date to clipboard in the page context
  const input = document.createElement("textarea");
  input.value = message;
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);

}



// Function to handle clicks on submenu items
function handleClipboardClick(content,sender) {
  // Display the results
  chrome.scripting.executeScript({
    target: { tabId: sender.tab.id },
    func: showConversionResults,
    args: [content]
  });
  console.log("Clicked on word copy:", content);
  // You can add more actions here, such as sending a message to content scripts
}

// Function to show conversion results as an alert on the page
function showConversionResultsAlert(message) {
  alert(message);
}
// Function to handle clicks on submenu items
function handleAlertClick(content,sender) {
  // Display the results
  chrome.scripting.executeScript({
    target: { tabId: sender.tab.id },
    func: showConversionResultsAlert,
    args: [content]
  });
  console.log("Clicked on word alert:", content);
  // You can add more actions here, such as sending a message to content scripts
}



function prepareTimezoneSpecificFormatStr(date, tzStr) {

  const dateUtc = new Date(date.toLocaleDateString("en-CA", { timeZone: "UTC" }) + 'T' + date.toLocaleTimeString("fr-FR", { timeZone: "UTC" }));
  const dateTz = new Date(date.toLocaleDateString("en-CA", { timeZone: tzStr }) + 'T' + date.toLocaleTimeString("fr-FR", { timeZone: tzStr }));

  const differenceInMinutes = (dateTz.getTime() - dateUtc.getTime()) / (1000 * 60);

  // Get the timezone offset in minutes and convert it to hours and minutes
  const offsetHours = Math.floor(Math.abs(differenceInMinutes) / 60);
  const offsetMinutes = Math.abs(differenceInMinutes) % 60;

  // Format the offset to include the '+' or '-' sign
  const offsetSign = differenceInMinutes < 0 ? '-' : '+';
  const formattedOffset = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

  return date.toLocaleDateString("en-CA", { timeZone: tzStr }) + ' ' + date.toLocaleTimeString("fr-FR", { timeZone: tzStr }) + ' ' + formattedOffset;
}

function prepareDisplayString(selectedText, date, sender) {
  // Convert to UTC
  // const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const utcDate = prepareTimezoneSpecificFormatStr(date, "UTC");

  // Convert to IST (IST)
  // const istDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const istDate = prepareTimezoneSpecificFormatStr(date, "Asia/Kolkata");

  // Convert to New York time (America/New_York)
  // const nyDate = new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const nyDate = prepareTimezoneSpecificFormatStr(date, "America/New_York");
  // const nyDate = date.toLocaleDateString("en-CA", { timeZone: "America/New_York" }) + ' ' + date.toLocaleTimeString("fr-FR", { timeZone: "America/New_York" });

  // Convert to CST Central timezone time (America/Chicago)
  // const centralDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const centralDate = prepareTimezoneSpecificFormatStr(date, "America/Chicago");
  // const centralDate = date.toLocaleDateString("en-CA", { timeZone: "America/Chicago" }) + ' ' + date.toLocaleTimeString("fr-FR", { timeZone: "America/Chicago" });

  // Format the dates
  const utcString = `${utcDate}  ${padStringToFixedLength('UTC', 20)}`;
  const istString = `${istDate}  ${padStringToFixedLength('IST', 20)}`;
  const nyString  = `${nyDate}  ${padStringToFixedLength('New York (US)', 20)}`;
  const centralString = `${centralDate}  ${padStringToFixedLength('Central (US)', 20)}`;

  const finalOutputStr =  `Input ${selectedText}\n\n${istString}\n${utcString}\n${nyString}\n${centralString}`;

  chrome.contextMenus.update("convertSelectedText_ist", {
    title: `${istString}`,
    visible: true
  });
  chrome.contextMenus.update("convertSelectedText_utc", {
    title: `${utcString}`,
    visible: true
  });
  chrome.contextMenus.update("convertSelectedText_ny", {
    title: `${nyString}`,
    visible: true
  });
  chrome.contextMenus.update("convertSelectedText_central", {
    title: `${centralString}`,
    visible: true
  });
  chrome.contextMenus.update("convertSelectedText_copy", {
    parentId: "convertSelectedText",
    title: `> Copy All to clipboard`,
    visible: true,
    onclick: () => handleClipboardClick(finalOutputStr, sender)
  });
  chrome.contextMenus.update("convertSelectedText_alert", {
    parentId: "convertSelectedText",
    title: `> Show as alert`,
    visible: true,
    onclick: () => handleAlertClick(finalOutputStr, sender)
  });
  return finalOutputStr;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "convertSelectedText",
      title: "Selected Text: \"%s\"",
      contexts: ["selection"],
      visible: false
    });
    chrome.contextMenus.create({
      id: `convertSelectedText_ist`,  // Unique ID for each submenu
      parentId: "convertSelectedText",
      title: "istString",
      contexts: ["selection"],
      visible: false
    });
    chrome.contextMenus.create({
      id: `convertSelectedText_utc`,  // Unique ID for each submenu
      parentId: "convertSelectedText",
      title: "utcString",
      contexts: ["selection"],
      visible: false
    });
    chrome.contextMenus.create({
      id: `convertSelectedText_ny`,  // Unique ID for each submenu
      parentId: "convertSelectedText",
      title: "nyString",
      contexts: ["selection"],
      visible: false
    });
    chrome.contextMenus.create({
      id: `convertSelectedText_central`,  // Unique ID for each submenu
      parentId: "convertSelectedText",
      title: "centralString",
      contexts: ["selection"],
      visible: false
    });
    chrome.contextMenus.create({
      id: `convertSelectedText_copy`,  // Unique ID for each submenu
      parentId: "convertSelectedText",
      title: `> Copy All to clipboard`,
      contexts: ["selection"],
      visible: false
    });
    chrome.contextMenus.create({
      id: `convertSelectedText_alert`,  // Unique ID for each submenu
      parentId: "convertSelectedText",
      title: `> Show as alert`,
      contexts: ["selection"],
      visible: false
    });
    console.log("Context menu created");
  });
});

// Listener for selection changes
chrome.runtime.onMessage.addListener((message, sender) => {
  console.log("Message received:", message);

  if (message.action === "checkSelection" && message.selectionText) {
    const selectedText = trimToMaxLength(message.selectionText.trim(), 50);
    date = parseDateTime(selectedText);
    if (!isNaN(date)) {
      var displayStr = prepareDisplayString(selectedText, date, sender);
      chrome.contextMenus.update("convertSelectedText", {
        title: `Convert Date > ${selectedText}`,
        visible: true
      });
    } else {
      chrome.contextMenus.update("convertSelectedText", {
        title: `Convert Date : Not DATE : ${selectedText}`,
        visible: true
      });
      chrome.contextMenus.update("convertSelectedText_ist", {
        visible: false
      });
      chrome.contextMenus.update("convertSelectedText_utc", {
        visible: false
      });
      chrome.contextMenus.update("convertSelectedText_ny", {
        visible: false
      });
      chrome.contextMenus.update("convertSelectedText_central", {
        visible: false
      });
      chrome.contextMenus.update("convertSelectedText_copy", {
        visible: false
      });
      chrome.contextMenus.update("convertSelectedText_alert", {
        visible: false
      });
    }

    
    console.log("Context menu updated with selection:", message.selectionText);
  }
});

// Handle when context menu is clicked
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "convertSelectedText") {
    console.log("Context menu clicked with selected text:", info.selectionText);
  }
});

