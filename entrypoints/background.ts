export default defineBackground(() => {
  chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({});
  });
});
